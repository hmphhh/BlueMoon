Tôi muốn thêm pagination thống nhất cho các danh sách cụ thể bên dưới, áp dụng cho cả Admin và User.

UI pagination mong muốn giống ảnh tham khảo, gồm:

* "Jump to Page: [page number]"
* "Rows per page: [10 / 20 / 50]"
* Style dark theme đồng bộ với UI hiện tại.

Yêu cầu chính:
Thêm pagination cho các màn hình danh sách sau:

Admin:

* Admin Accounts
* Admin Bills
* Admin Bill Templates
* Admin Campaigns
* Admin Invoices
* Admin Payments
* Admin Reports
* Admin Notifications

User:

* User Bills
* User Contributions
* User Invoices
* User Reports
* User Notifications

Không cần áp dụng lan man cho toàn bộ app nếu màn đó không thuộc các list trên.

1. Tạo component pagination dùng chung

Tạo một reusable component, ví dụ:

* PaginationControls
* TablePagination
* ListPagination

Component này nhận các props cơ bản:

* currentPage
* totalPages
* pageSize
* totalItems
* onPageChange(page)
* onPageSizeChange(size)
* pageSizeOptions

Default pageSizeOptions:

* 10
* 20
* 50

Default pageSize là 10.

UI component cần có:

* Jump to Page:

  * Cho phép người dùng nhập hoặc chọn số trang.
  * Không cho page nhỏ hơn 1.
  * Không cho page lớn hơn totalPages.
  * Nếu totalPages = 0 thì disable control hoặc xử lý an toàn.
* Rows per page:

  * Dropdown chọn số dòng mỗi trang.
  * Default là 10.

Vị trí hiển thị:

* Pagination nằm ở cuối mỗi list/table/card.
* Nếu list đang nằm trong card thì pagination nằm trong card, phía dưới danh sách.
* Không đặt pagination ở đầu danh sách.

Style:

* Dark theme giống UI hiện tại.
* Màu chữ, border, dropdown, spacing đồng bộ với các filter/search hiện có.
* Không phá responsive layout.
* Trên mobile/tablet, pagination có thể wrap xuống dòng nhưng vẫn dễ dùng.

2. Logic pagination ở frontend

Mỗi list cần có state:

* currentPage
* pageSize

Default:

* currentPage = 1
* pageSize = 10

Khi người dùng đổi page:

* Cập nhật currentPage.
* Reload/refetch danh sách theo page mới.

Khi người dùng đổi rows per page:

* Cập nhật pageSize.
* Reset currentPage về 1.
* Reload/refetch danh sách.

Khi search/filter/sort thay đổi:

* Reset currentPage về 1.
* Reload/refetch danh sách với query mới.

Frontend bắt buộc phải debounce search input:

* Với các ô search, không gọi API ngay ở mỗi lần gõ phím.
* Áp dụng debounce khoảng 300ms - 500ms trước khi refetch list.
* Mục tiêu là tránh spam server khi người dùng nhập liên tục.
* Khi debounce search value thay đổi thì reset currentPage về 1.

Khi xóa item:

* Nếu page hiện tại bị rỗng và currentPage > 1 thì tự chuyển về page hợp lệ gần nhất.
* Ví dụ giảm currentPage xuống currentPage - 1 rồi refetch.
* Không để UI đứng ở một page trống sai logic.

Cần xử lý request race condition:

* Nếu người dùng search/filter/page liên tục, không để response cũ ghi đè response mới.
* Có thể dùng AbortController, request id, hoặc cơ chế tương đương để bỏ qua stale response.

3. Backend/API pagination

Nếu backend đã hỗ trợ pagination:

* Tận dụng logic hiện có.
* Đảm bảo tất cả list endpoint liên quan đều nhận page và limit.
* Không đổi database schema nếu không cần.

Nếu backend chưa hỗ trợ pagination:

* Thêm pagination cho các endpoint danh sách tương ứng với các màn hình sau:

  * Admin Accounts
  * Admin Bills
  * Admin Bill Templates
  * Admin Campaigns
  * Admin Invoices
  * Admin Payments
  * Admin Reports
  * Admin Notifications
  * User Bills
  * User Contributions
  * User Invoices
  * User Reports
  * User Notifications

Query params thống nhất:

* page
* limit
* search nếu endpoint đó có search
* status/filter nếu endpoint đó có filter
* sort nếu endpoint đó có sort

Ví dụ:
GET /bills?page=1&limit=10&search=abc&status=unpaid

Frontend dùng page bắt đầu từ 1:

* Page đầu tiên là page = 1.
* UI hiển thị page bắt đầu từ 1.

Backend lưu ý nếu dùng Spring Boot / Spring Data JPA:

* Spring Data JPA Pageable / PageRequest dùng page index bắt đầu từ 0.
* Phải convert page từ frontend sang backend trước khi tạo Pageable.
* Ví dụ:
  PageRequest.of(page - 1, limit)
* Cần validate để page không nhỏ hơn 1 trước khi trừ.
* Response trả về frontend vẫn phải map lại thành page bắt đầu từ 1.
* Ví dụ:
  response.pagination.page = pageResult.getNumber() + 1
* Không trả page index kiểu 0-based về frontend vì sẽ làm UI hiển thị sai.

Nếu không dùng Spring Data JPA thì dùng công thức logic:
skip = (page - 1) * limit
take = limit

Response nên có dạng thống nhất:

{
"data": [],
"pagination": {
"page": 1,
"limit": 10,
"totalItems": 0,
"totalPages": 0
}
}

Lưu ý quan trọng:

* totalItems phải là tổng số item sau khi đã áp dụng search/filter.
* totalPages = Math.ceil(totalItems / limit).
* Không tính totalItems bằng tổng toàn bộ database nếu người dùng đang search/filter.
* Search/filter/sort hiện có không được bị mất.
* Không phá permission hiện tại.
* Admin vẫn chỉ thấy dữ liệu theo quyền admin hiện tại.
* User vẫn chỉ thấy dữ liệu của chính user đó.
* Không để user xem được dữ liệu của user khác.

4. Tối ưu count query và hiệu năng database

Nếu backend dùng Spring Data JPA:

* Với các repository list đơn giản, có thể dùng Page<T> để lấy data kèm totalItems/totalPages.
* Với query phức tạp, đặc biệt query có JOIN, search, filter, native query, hoặc nhiều điều kiện WHERE, cần cân nhắc viết countQuery riêng.
* Không để Spring tự derive count query nếu query chính quá phức tạp hoặc có nguy cơ sinh SQL count kém hiệu năng.
* Với @Query hoặc native query phức tạp, viết riêng:

  * value query để fetch data
  * countQuery để đếm tổng số dòng
* countQuery phải áp dụng cùng điều kiện search/filter/permission với query fetch data.
* countQuery chỉ nên đếm field cần thiết, không select thừa dữ liệu.
* Cần đảm bảo các cột dùng nhiều cho search/filter/sort có index phù hợp nếu cần.
* Không query toàn bộ bảng rồi mới phân trang ở memory.

Ví dụ ý tưởng với Spring Data JPA:

@Query(
value = "SELECT b FROM Bill b WHERE ...",
countQuery = "SELECT COUNT(b.id) FROM Bill b WHERE ..."
)
Page<Bill> findBillsWithFilters(..., Pageable pageable);

Lưu ý:

* Vì UI yêu cầu Jump to Page và totalPages, backend cần trả totalItems/totalPages.
* Do đó Page<T> phù hợp hơn Slice<T> trong các màn hình cần biết tổng số trang.
* Chỉ cân nhắc Slice<T> nếu một màn hình không cần totalItems/totalPages và chỉ cần next/previous.

5. Validate page và limit ở backend

Backend cần validate query params:

* Nếu page null hoặc page < 1 thì dùng page = 1.
* Nếu limit null thì dùng limit = 10.
* Nếu limit không nằm trong danh sách cho phép thì clamp hoặc fallback về 10.
* Không cho limit quá lớn để tránh user request quá nhiều data.
* Max limit là 50.

Allowed limits:

* 10
* 20
* 50

Nếu sort được truyền từ frontend:

* Chỉ cho sort theo whitelist field hợp lệ.
* Không truyền trực tiếp field sort không kiểm soát vào query.
* Nếu sort invalid thì fallback về sort mặc định.

6. Áp dụng vào đúng các list đã chỉ định

Với mỗi list/table/card list trong các màn sau:

* Admin Accounts
* Admin Bills
* Admin Bill Templates
* Admin Campaigns
* Admin Invoices
* Admin Payments
* Admin Reports
* Admin Notifications
* User Bills
* User Contributions
* User Invoices
* User Reports
* User Notifications

Cần:

* Thêm PaginationControls ở cuối danh sách.
* Truyền đúng:

  * currentPage
  * pageSize
  * totalItems
  * totalPages
  * onPageChange
  * onPageSizeChange
* Khi đổi page hoặc pageSize thì refetch lại data.
* Không copy-paste pagination UI ở từng page.
* Tái sử dụng component dùng chung.

7. Empty state

Nếu không có dữ liệu:

* Giữ empty state hiện tại.
* Ví dụ:

  * "No bills found"
  * "No templates yet"
  * "No accounts found"
  * "No invoices found"
  * "No reports found"
  * "No notifications found"
* Nếu totalItems = 0 thì có thể ẩn pagination.
* Nếu vẫn hiện pagination thì phải disable toàn bộ control.
* Không để Jump to Page nhảy lỗi khi totalPages = 0.

8. Loading state

Khi đổi page hoặc pageSize:

* Hiển thị loading state/skeleton/spinner nếu list hiện tại đã có.
* Không để dữ liệu cũ hiển thị sai quá lâu.
* Không làm UI bị giật mạnh.
* Không reset toàn bộ page nếu chỉ đang đổi page của list.

9. Tương thích với search/filter hiện có

Ví dụ màn Bills hiện có:

* Search bills
* Filter All Status
* Generate from Template
* Create Bill

Sau khi thêm pagination:

* Search vẫn hoạt động bình thường.
* Search phải có debounce 300ms - 500ms.
* Filter status vẫn hoạt động bình thường.
* Generate from Template không bị ảnh hưởng.
* Create Bill không bị ảnh hưởng.
* Khi search/filter thay đổi thì currentPage phải reset về 1.
* totalItems và totalPages phải phản ánh đúng kết quả sau search/filter.

Tương tự cho:

* Admin Accounts
* Admin Bills
* Admin Bill Templates
* Admin Campaigns
* Admin Invoices
* Admin Payments
* Admin Reports
* Admin Notifications
* User Bills
* User Contributions
* User Invoices
* User Reports
* User Notifications

10. Refactor code

Yêu cầu code:

* Tạo component dùng chung cho pagination.
* Nếu project đã có hook/service fetch list thì cập nhật hook/service đó để hỗ trợ page và limit.
* Nếu chưa có thì có thể tạo hook dùng chung, ví dụ:

  * usePagination
  * usePaginatedQuery
* Không duplicate logic fetch/create/update/delete nếu đã có sẵn.
* Không thay đổi business logic không liên quan.
* Không đổi database schema nếu không cần.
* Không xóa tính năng hiện có.
* Không phá route hiện tại.
* Sau khi thêm xong, kiểm tra unused import, unused state, lỗi TypeScript/ESLint nếu có.

11. UI chi tiết theo ảnh tham khảo

Ở cuối danh sách hiển thị dạng:

Jump to Page:  1 ▼        Rows per page:  10 ▼

Yêu cầu:

* "Jump to Page" nằm trước.
* "Rows per page" nằm sau.
* Hai control nằm cùng một hàng trên desktop.
* Trên màn hình nhỏ thì có thể xuống dòng.
* Dropdown/input phải cùng style dark theme.
* Text màu sáng phù hợp với nền tối.
* Không dùng style trắng sáng lệch theme.

12. Acceptance criteria

Sau khi hoàn thành:

* Các list sau đều có pagination:

  * Admin Accounts
  * Admin Bills
  * Admin Bill Templates
  * Admin Campaigns
  * Admin Invoices
  * Admin Payments
  * Admin Reports
  * Admin Notifications
  * User Bills
  * User Contributions
  * User Invoices
  * User Reports
  * User Notifications
* Default rows per page = 10.
* Có thể jump đến page cụ thể.
* Có thể đổi rows per page sang 10, 20, 50.
* Search input có debounce 300ms - 500ms.
* Search/filter/sort reset page về 1.
* totalItems đúng theo dữ liệu sau filter/search.
* totalPages tính đúng.
* Nếu dùng Spring Data JPA thì đã convert đúng frontend page 1-based sang backend PageRequest 0-based.
* Nếu query phức tạp thì có countQuery riêng hoặc tối ưu tương đương.
* Backend validate page và limit.
* Không còn màn hình nào trong danh sách áp dụng load toàn bộ dữ liệu lớn một lần nếu backend có thể phân trang.
* UI vẫn đúng dark theme.
* Không bị vỡ layout.
* Không phá các chức năng create/update/delete/generate hiện có.
