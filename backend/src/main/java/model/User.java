package model;
public record User(Long id, String fullName, String email, String phone, String passwordHash, String role, String status, String birthDate, String address, String avatarUrl) {}
