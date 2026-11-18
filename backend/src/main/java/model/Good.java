package model;
public record Good(Long id, String code, String name, String groupName, String unit, double quantity, double reservedQuantity, double minQuantity, String supplier, String status) {}
