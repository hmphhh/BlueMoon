package com.bluemoon.backend.dtos.request;

import com.bluemoon.backend.enums.UserRole;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {

    private String username;
    private String password;
    private String email;
    private UserRole role;

    private Long residentId;
    private ResidentRequest resident;
}