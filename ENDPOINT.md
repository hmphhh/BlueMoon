# Profile APIs: (ProfileController.java, ...)
## Endpoint
GET /api/me:
## Usage 
Get the current logged-in user profile (also include the resident related information)
### Authorization
- USER
- ADMIN
### Response Body: (ProfileResponse.java)
{
    "id":,
    "email":,
    "isVerified":,
    "resident": {
        "id":,
        "fullName":,
        "idNumber":,
        "dateOfBirth":,
        "gender":,
        "phone":,
        "relationship":,
        "status",
        "apartment": {
            "id":,
            "apartmentNumber":
        }
    } 
}
### Notes:
- resident may be null
- apartment contains only simplified information (apartmentNumber)
---

## Update User Profile
### Endpoint
PUT /api/me
### Usage
Update the current logged-in user profile
### Authorization
- USER
- ADMIN
### Request Body (UpdateProfileRequest.java)
{
    "email":,
    "resident": {
        "fullName":,
        "dateOfBirth":,
        "phone":,
        "gender":
    }
}
### Response Body (ProfileResponse.java)
### Notes:
- resident may be null
- some fields cannot be edited
---

## Password/Email-related
### Authorization
- USER
- ADMIN
### Notes:
- just move the endpoint from /users to /me
---

# User APIs: (UserController.java, ...)
## Get All Users
### Endpoint:
GET api/users
### Usage:
- Get all users (simplified)
### Authorization:
- ADMIN
### Response Body: (List<UserResponse>, need to fix to fit with new one)
{
    "contents": [
        {
            "id":,
            "username":,
            "email":,
            "role":,
            "isVerified":,
            "createdAt":,
            "isLinked":
        }
    ]  
}
### Notes:
- isLinked field means no residents is linked to this user (residentId = null)
---

## Get User Details
### Endpoint
GET api/users/{userId}
### Usage
- Get details from user with id = {userId}
### Authorization
- ADMIN
### Response Body (UserDetailsResponse.java)
{
    "id":,
    "email":,
    "isVerified":,
    "role":,
    "createdAt":,
    "resident": {
        "id":,
        "fullName":,
        "idNumber":,
        "dateOfBirth":,
        "gender":,
        "phone":,
        "relationship":,
        "status",
        "apartment": {
            "id":,
            "apartmentNumber":
        }
    } 
}
### Notes:
- resident is null means this account has no residents information

## Create User:
### Endpoint
POST api/users
### Usage
- Create a new user
### Authorization
- ADMIN
### Request Body (UserRequest.java, done)
### Response Body (UserDetailsResponse.java)
### Notes:
- residentId and resident cannot be non-null at the same time
- if both fields are null, then residentId in entity is null
- the service logic is done
---

## Update User:
### Endpoints:
PUT api/users/{userId}
- Update already existed user
### Authorization
- ADMIN
### Request Body
{
    "residentId":,
}
### Response Body (UserDetailsResponse.java)
### Notes:
- residentId = null means unlink current users from resident
- residentId != null means link current users with resident has residentId
- need to check whether new resident is already linked or not

# Resident APIs (ResidentController.java, ...)
## Get All Residents
### Endpoint
GET api/residents
### Usage:
- Get all residents (simplified)
### Authorization
- ADMIN
### ResponseBody (List<ResidentResponse>, need to fix to fit with this one)
{
    "contents": [
        {
            "id":,
            "fullName":,
            "idNumber":,
            "phone":,
            "status":,
            "isLinked":
            "apartmentNumber":
        } 
    ]
}
### Notes:
- isLinked in ResidentResponse means whether the resident is linked with an user or not
- apartmentNumber is fetched to give meaningful information about apartment
- to find all of this, may be use JPQL
---

## Get Resident Details
GET api/residents/{residentId}
### Usage:
- Get details of resident with residentId = {residentId}
### Authorization
- ADMIN
### ResponseBody (ResidentDetailsResponse.java)
{
    {
        "id":,
        "fullName":,
        "idNumber":,
        "gender":,
        "relationship":,
        "phone":,
        "status":,
        "isLinked":
        "apartment": {
            "id":,
            "apartmentNumber":
        }
        "account": {
            "id":,
            "username":,
            "email":,
            "isVerified":,
        }
    } 
}
### Notes:
- account may be null
- apartment contains simplified information only
---

## Create Resident
### Endpoint
POST api/residents
### Usage
- Create new resident information
### Authorization
- ADMIN
### Request Body (ResidentRequest.java, fixed, do not alter)
### Response Body (ResidentResponse.java)
---

## Update Resident
### Endpoint
PUT api/residents/{residentId}
### Request Body (ResidentRequest.java)
### Response Body (ResidentResponse.java)
### Notes:
- fields are optional
---

# Apartment APIs (ApartmentController.java, ...)
## Get All Apartments
### Endpoint
GET api/apartments
### Usage
- Get all apartments (simplified)
### Authorization
- ADMIN
### Response Body (List<ApartmentResponse.java>, need to fix to new one)
{
    "contents": [
        {
            "id":,
            "apartmentNumber":,
            "residentCount":,
            "status",
        }
    ]
}
### Notes:
- residentCount is the total count of residents currently in this apartment
- may use JPQL to find
---

## Get Apartment Details
### Endpoint
GET /api/apartments/{apartmentId}

### Usage
Get details about apartment with apartmentId = {apartmentId}
### Authorization
- ADMIN
### ResponseBody (ApartmentDetailsResponse.java)
{
    "id":,
    "apartmentNumber":,
    "floor":,
    "area":,
    "type":,
    "status":,
    "residents": [
        {
            "id":,
            "fullName":,
            "idNumber":,
            "phone":,
            "relationship":,
            "status":,
            "gender":
        }
    ]
}
### Notes:
- You may use different java class for residents field

## Create Apartment
### Endpoint
POST /api/apartments
### Authorization
- ADMIN
### Usage
- Create new apartment
### Request Body (ApartmentRequest.java, fixed, do not alter)
### Response Body (ApartmentResponse.java)

## Update Apartment
### Endpoint
PUT api/apartments

### Usage
Update apartment information

### Authorization
- ADMIN
### Request Body (ApartmentRequest.java, fixed, do not alter)
### Response Body (ApartmentResponse.java)

# Note:
- Auth related is fixed, do not alter,
- Delete for each APIs is fixed, do not alter
- To add/remove resident of an apartment, use Resident APIs
- To link/unlink user to/from resident, use User APIs

# Answer:
1. You should modify already existed one, since some is already fixed, and do not need further changes, about DTOs, if name matched, fix it, else create new one
2. Read it yourself, if you find them, then you may or may not modify them, if not, create them, it is in /dtos
3. You may use JPQL to avoid N+1 queries, since if it is handled at service layer, then you may loop to check right, which may not efficient
4. It is not existed, the old endpoints are located in User related components, I want to move them to new one, to make it more separable. To conclude, it is new, but the old logic maybe reused (in the User related components)
5. I would prefer that, and if better provide filtering and searching (via @RequestParams), but first I need to make it work first, so you may do it later, just need to remember that