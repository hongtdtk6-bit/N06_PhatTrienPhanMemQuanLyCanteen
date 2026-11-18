package repository;

import model.Good;
import utils.Db;

import java.sql.*;
import java.util.*;

public class GoodRepository {

 // =========================
 // LẤY DANH SÁCH HÀNG HÓA
 // =========================
 public List<Good> all(String q) throws SQLException {

  List<Good> l = new ArrayList<>();

  String sql =
          "SELECT * FROM goods " +
                  "WHERE (?='' " +
                  "OR code LIKE ? " +
                  "OR name LIKE ? " +
                  "OR group_name LIKE ? " +
                  "OR status=?) " +
                  "ORDER BY id DESC";

  try (
          Connection c = Db.getConnection();
          PreparedStatement p = c.prepareStatement(sql)
  ) {

   String x = q == null ? "" : q.trim();

   p.setString(1, x);
   p.setString(2, "%" + x + "%");
   p.setString(3, "%" + x + "%");
   p.setString(4, "%" + x + "%");
   p.setString(5, x);

   try (ResultSet r = p.executeQuery()) {

    while (r.next()) {
     l.add(map(r));
    }
   }
  }

  return l;
 }


 // =========================
 // THÊM HÀNG HÓA
 // =========================
 public long create(Good g) throws SQLException {

  validateGood(g);

  String q =
          "INSERT INTO goods(" +
                  "code,name,group_name,unit,quantity," +
                  "reserved_quantity,min_quantity,supplier,status" +
                  ") VALUES(?,?,?,?,?,0,?,?,?)";

  try (
          Connection c = Db.getConnection();
          PreparedStatement p =
                  c.prepareStatement(q, Statement.RETURN_GENERATED_KEYS)
  ) {

   p.setString(1, g.code());
   p.setString(2, g.name());
   p.setString(3, g.groupName());
   p.setString(4, g.unit());
   p.setDouble(5, g.quantity());
   p.setDouble(6, g.minQuantity());
   p.setString(7, g.supplier());
   p.setString(8, g.status());

   p.executeUpdate();

   try (ResultSet r = p.getGeneratedKeys()) {

    if (r.next()) {
     return r.getLong(1);
    }
   }
  }

  throw new SQLException("Không thể tạo hàng hóa");
 }


 // =========================
 // CẬP NHẬT HÀNG HÓA
 // =========================
 public void update(long id, Good g) throws SQLException {

  if (id <= 0) {
   throw new IllegalArgumentException(
           "ID hàng hóa không hợp lệ"
   );
  }

  validateGood(g);

  String q =
          "UPDATE goods SET " +
                  "code=?," +
                  "name=?," +
                  "group_name=?," +
                  "unit=?," +
                  "quantity=?," +
                  "min_quantity=?," +
                  "supplier=?," +
                  "status=? " +
                  "WHERE id=?";

  try (
          Connection c = Db.getConnection();
          PreparedStatement p = c.prepareStatement(q)
  ) {

   p.setString(1, g.code());
   p.setString(2, g.name());
   p.setString(3, g.groupName());
   p.setString(4, g.unit());

   // QUAN TRỌNG:
   // trước đây update() không cập nhật quantity
   p.setDouble(5, g.quantity());

   p.setDouble(6, g.minQuantity());
   p.setString(7, g.supplier());
   p.setString(8, g.status());

   p.setLong(9, id);

   int rows = p.executeUpdate();

   if (rows == 0) {
    throw new IllegalArgumentException(
            "Không tìm thấy hàng hóa có ID = " + id
    );
   }
  }
 }


 // =========================
 // NGỪNG SỬ DỤNG
 // =========================
 public void stop(long id) throws SQLException {

  if (id <= 0) {
   throw new IllegalArgumentException(
           "ID hàng hóa không hợp lệ"
   );
  }

  String q =
          "UPDATE goods " +
                  "SET status='STOPPED' " +
                  "WHERE id=?";

  try (
          Connection c = Db.getConnection();
          PreparedStatement p = c.prepareStatement(q)
  ) {

   p.setLong(1, id);

   int rows = p.executeUpdate();

   if (rows == 0) {
    throw new IllegalArgumentException(
            "Không tìm thấy hàng hóa"
    );
   }
  }
 }


 // =========================
 // HÀNG HÓA SẮP HẾT
 // =========================
 public List<Good> lowStock() throws SQLException {

  List<Good> l = new ArrayList<>();

  String sql =
          "SELECT * FROM goods " +
                  "WHERE status='ACTIVE' " +
                  "AND quantity-reserved_quantity<=min_quantity " +
                  "ORDER BY quantity-reserved_quantity";

  try (
          Connection c = Db.getConnection();
          PreparedStatement p = c.prepareStatement(sql);
          ResultSet r = p.executeQuery()
  ) {

   while (r.next()) {
    l.add(map(r));
   }
  }

  return l;
 }


 // =========================
 // VALIDATE
 // =========================
 private void validateGood(Good g) {

  if (g == null) {
   throw new IllegalArgumentException(
           "Thông tin hàng hóa không được để trống"
   );
  }

  if (g.code() == null || g.code().isBlank()) {
   throw new IllegalArgumentException(
           "Mã hàng không được để trống"
   );
  }

  if (g.name() == null || g.name().isBlank()) {
   throw new IllegalArgumentException(
           "Tên hàng không được để trống"
   );
  }

  if (g.unit() == null || g.unit().isBlank()) {
   throw new IllegalArgumentException(
           "Đơn vị không được để trống"
   );
  }

  if (g.quantity() < 0) {
   throw new IllegalArgumentException(
           "Số lượng tồn không được âm"
   );
  }

  if (g.minQuantity() < 0) {
   throw new IllegalArgumentException(
           "Mức tồn tối thiểu không được âm"
   );
  }

  if (g.status() == null || g.status().isBlank()) {
   throw new IllegalArgumentException(
           "Trạng thái không hợp lệ"
   );
  }
 }


 // =========================
 // MAP DATABASE -> MODEL
 // =========================
 private Good map(ResultSet r) throws SQLException {

  return new Good(
          r.getLong("id"),
          r.getString("code"),
          r.getString("name"),
          r.getString("group_name"),
          r.getString("unit"),
          r.getDouble("quantity"),
          r.getDouble("reserved_quantity"),
          r.getDouble("min_quantity"),
          r.getString("supplier"),
          r.getString("status")
  );
 }
}