package repository;

import model.User;
import utils.Db;
import java.sql.*;
import java.util.*;

public class UserRepository {
    public Optional<User> login(String identifier,String passwordHash)throws SQLException{
        String sql="SELECT * FROM users WHERE (email=? OR phone=?) AND password_hash=? AND status='ACTIVE'";
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(sql)){
            p.setString(1,identifier);p.setString(2,identifier);p.setString(3,passwordHash);
            try(ResultSet r=p.executeQuery()){if(r.next())return Optional.of(map(r));}
        }return Optional.empty();
    }
    public boolean existsEmail(String email)throws SQLException{return exists("SELECT 1 FROM users WHERE email=?",email);}
    public boolean existsPhone(String phone)throws SQLException{return exists("SELECT 1 FROM users WHERE phone=?",phone);}
    private boolean exists(String q,String v)throws SQLException{try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(q)){p.setString(1,v);try(ResultSet r=p.executeQuery()){return r.next();}}}
    public long create(String fullName,String email,String phone,String passwordHash)throws SQLException{
        String q="INSERT INTO users(full_name,email,phone,password_hash,role) VALUES(?,?,?,?, 'CUSTOMER')";
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(q,Statement.RETURN_GENERATED_KEYS)){
            p.setString(1,fullName);p.setString(2,email);p.setString(3,phone);p.setString(4,passwordHash);p.executeUpdate();
            try(ResultSet r=p.getGeneratedKeys()){r.next();return r.getLong(1);}
        }
    }
    public long createStaff(String fullName,String email,String phone,String passwordHash,String role)throws SQLException{
        String q="INSERT INTO users(full_name,email,phone,password_hash,role) VALUES(?,?,?,?,?)";
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(q,Statement.RETURN_GENERATED_KEYS)){
            p.setString(1,fullName);p.setString(2,email);p.setString(3,phone);p.setString(4,passwordHash);p.setString(5,role);p.executeUpdate();
            try(ResultSet r=p.getGeneratedKeys()){r.next();return r.getLong(1);}
        }
    }
    public List<User> findAll()throws SQLException{
        List<User> out=new ArrayList<>();
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("SELECT * FROM users ORDER BY id DESC");ResultSet r=p.executeQuery()){while(r.next())out.add(map(r));}
        return out;
    }
    public Optional<User> findById(long id)throws SQLException{try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("SELECT * FROM users WHERE id=?")){p.setLong(1,id);try(ResultSet r=p.executeQuery()){if(r.next())return Optional.of(map(r));}}return Optional.empty();}
    public void update(
            long id,
            String fullName,
            String email,
            String phone,
            String role,
            String status,
            String birthDate,
            String address,
            String avatarUrl
    ) throws SQLException {

        String sql = """
        UPDATE users
        SET full_name = ?,
            email = ?,
            phone = ?,
            role = ?,
            status = ?,
            birth_date = ?,
            address = ?,
            avatar_url = ?
        WHERE id = ?
        """;

        try (
                Connection c = Db.getConnection();
                PreparedStatement p = c.prepareStatement(sql)
        ) {
            p.setString(1, fullName);
            p.setString(2, email);
            p.setString(3, phone);
            p.setString(4, role);
            p.setString(5, status);

            // birth_date
            if (birthDate == null || birthDate.isBlank()) {
                p.setNull(6, Types.DATE);
            } else {
                p.setDate(6, java.sql.Date.valueOf(birthDate));
            }

            // address
            if (address == null || address.isBlank()) {
                p.setNull(7, Types.VARCHAR);
            } else {
                p.setString(7, address);
            }

            // avatar
            if (avatarUrl == null || avatarUrl.isBlank()) {
                p.setNull(8, Types.VARCHAR);
            } else {
                p.setString(8, avatarUrl);
            }

            p.setLong(9, id);

            int rows = p.executeUpdate();

            if (rows == 0) {
                throw new SQLException("Không tìm thấy tài khoản có ID = " + id);
            }
        }
    }
    public boolean existsEmailExceptId(String email, long id) throws SQLException {
        String sql = "SELECT 1 FROM users WHERE email=? AND id<>?";

        try (
                Connection c = Db.getConnection();
                PreparedStatement p = c.prepareStatement(sql)
        ) {
            p.setString(1, email);
            p.setLong(2, id);

            try (ResultSet r = p.executeQuery()) {
                return r.next();
            }
        }
    }

    public boolean existsPhoneExceptId(String phone, long id) throws SQLException {
        String sql = "SELECT 1 FROM users WHERE phone=? AND id<>?";

        try (
                Connection c = Db.getConnection();
                PreparedStatement p = c.prepareStatement(sql)
        ) {
            p.setString(1, phone);
            p.setLong(2, id);

            try (ResultSet r = p.executeQuery()) {
                return r.next();
            }
        }
    }
    public void updatePassword(long id,String hash)throws SQLException{try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("UPDATE users SET password_hash=? WHERE id=?")){p.setString(1,hash);p.setLong(2,id);p.executeUpdate();}}
    public boolean checkPassword(long id,String hash)throws SQLException{try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("SELECT 1 FROM users WHERE id=? AND password_hash=?")){p.setLong(1,id);p.setString(2,hash);try(ResultSet r=p.executeQuery()){return r.next();}}}
    public void delete(long id)throws SQLException{try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("DELETE FROM users WHERE id=?")){p.setLong(1,id);p.executeUpdate();}}
    private User map(ResultSet r)throws SQLException{return new User(r.getLong("id"),r.getString("full_name"),r.getString("email"),r.getString("phone"),r.getString("password_hash"),r.getString("role"),r.getString("status"),r.getString("birth_date"),r.getString("address"),r.getString("avatar_url"));}
}
