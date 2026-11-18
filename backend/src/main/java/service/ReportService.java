package service;

import utils.Db;
import java.sql.*;
import java.util.*;

public class ReportService {
    public Map<String,Object> revenue() throws SQLException {
        Map<String,Object> m=new LinkedHashMap<>();
        String q="SELECT COALESCE(SUM(total_amount),0) revenue, COUNT(*) order_count FROM orders WHERE status='COMPLETED' AND payment_status='PAID'";
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(q);ResultSet r=p.executeQuery()){
            r.next();m.put("revenue",r.getDouble("revenue"));m.put("orderCount",r.getInt("order_count"));
        } return m;
    }
    public List<Map<String,Object>> orders()throws SQLException{
        return query("SELECT status,COUNT(*) count FROM orders GROUP BY status ORDER BY count DESC");
    }
    public List<Map<String,Object>> bestSelling()throws SQLException{
        return query("SELECT f.id,f.name,SUM(oi.quantity) quantity FROM order_items oi JOIN foods f ON f.id=oi.food_id JOIN orders o ON o.id=oi.order_id WHERE o.status='COMPLETED' GROUP BY f.id,f.name ORDER BY quantity DESC LIMIT 10");
    }
    public List<Map<String,Object>> inventory()throws SQLException{
        return query("SELECT id,name,unit,quantity,min_quantity,status FROM goods ORDER BY quantity ASC");
    }
    private List<Map<String,Object>> query(String q)throws SQLException{
        List<Map<String,Object>> out=new ArrayList<>();
        try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(q);ResultSet r=p.executeQuery()){
            ResultSetMetaData md=r.getMetaData();
            while(r.next()){
                Map<String,Object> row=new LinkedHashMap<>();
                for(int i=1;i<=md.getColumnCount();i++) row.put(md.getColumnLabel(i),r.getObject(i));
                out.add(row);
            }
        } return out;
    }
}
