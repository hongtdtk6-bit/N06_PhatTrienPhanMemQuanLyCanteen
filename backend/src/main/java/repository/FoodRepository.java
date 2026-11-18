package repository;

import model.Food;
import utils.Db;
import java.sql.*;
import java.util.*;

public class FoodRepository {
    public List<Food> all() throws SQLException {
        List<Food> list=new ArrayList<>();
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("SELECT * FROM foods ORDER BY id DESC");ResultSet r=p.executeQuery()){
            while(r.next()) list.add(map(r));
        }
        return list;
    }
    public long create(Food f)throws SQLException{
        String q="INSERT INTO foods(name,description,category,price,image_url,status) VALUES(?,?,?,?,?,?)";
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(q,Statement.RETURN_GENERATED_KEYS)){
            p.setString(1,f.name());p.setString(2,f.description());p.setString(3,f.category());p.setDouble(4,f.price());p.setString(5,f.imageUrl());p.setString(6,f.status());
            p.executeUpdate();try(ResultSet r=p.getGeneratedKeys()){r.next();return r.getLong(1);}
        }
    }
    public void update(long id,Food f)throws SQLException{
        String q="UPDATE foods SET name=?,description=?,category=?,price=?,image_url=?,status=? WHERE id=?";
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(q)){
            p.setString(1,f.name());p.setString(2,f.description());p.setString(3,f.category());p.setDouble(4,f.price());p.setString(5,f.imageUrl());p.setString(6,f.status());p.setLong(7,id);p.executeUpdate();
        }
    }
    public void stop(long id)throws SQLException{
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("UPDATE foods SET status='STOPPED' WHERE id=?")){p.setLong(1,id);p.executeUpdate();}
    }
    public Optional<Food> find(long id)throws SQLException{
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("SELECT * FROM foods WHERE id=?")){
            p.setLong(1,id);try(ResultSet r=p.executeQuery()){if(r.next())return Optional.of(map(r));}
        }return Optional.empty();
    }
    private Food map(ResultSet r)throws SQLException{
        return new Food(r.getLong("id"),r.getString("name"),r.getString("description"),r.getString("category"),
                r.getDouble("price"),r.getString("image_url"),r.getString("status"));
    }
}
