package model;
import java.util.List;
public record OrderRequest(Long customerId, String note, List<OrderItemRequest> items, String paymentMethod) {}
