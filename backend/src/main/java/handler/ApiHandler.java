package handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import model.*;
import repository.*;
import service.AuthService;
import utils.*;

import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class ApiHandler implements HttpHandler {
    private final UserRepository users=new UserRepository();
    private final GoodRepository goods=new GoodRepository();
    private final AuthService auth=new AuthService();
    private final Map<String,Long> sessions=new ConcurrentHashMap<>();
    private static final DateTimeFormatter DT=DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    @Override public void handle(HttpExchange ex)throws IOException{
        try{
            HttpUtil.cors(ex); if("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) return;
            String path=ex.getRequestURI().getPath(), method=ex.getRequestMethod();
            if(path.equals("/api/health")){ok(ex,Map.of("success",true,"message","Canteen API is running"));return;}

            if(path.equals("/api/auth/login")&&method.equals("POST")){Map<?,?> b=body(ex);User u=auth.login(str(b,"identifier",str(b,"email","")),str(b,"password"));String token=UUID.randomUUID().toString();sessions.put(token,u.id());ok(ex,Map.of("user",safeUser(u),"token",token));return;}
            if(path.equals("/api/auth/register")&&method.equals("POST")){Map<?,?> b=body(ex);long id=auth.register(str(b,"fullName"),str(b,"email"),str(b,"phone"),str(b,"password"));ok(ex,Map.of("id",id,"message","Đăng ký thành công"));return;}
            if(path.equals("/api/auth/logout")&&method.equals("POST")){String t=token(ex);if(t!=null)sessions.remove(t);ok(ex,Map.of("message","Đã đăng xuất"));return;}

            if(path.equals("/api/users")&&method.equals("GET")){ok(ex,users.findAll().stream().map(this::safeUser).toList());return;}
            if(path.equals("/api/users")&&method.equals("POST")){Map<?,?> b=body(ex);validateRole(str(b,"role","STAFF"));String password=str(b,"password");if(password.length()<6)throw new IllegalArgumentException("Mật khẩu tối thiểu 6 ký tự");if(users.existsEmail(str(b,"email")))throw new IllegalArgumentException("Email đã tồn tại");if(users.existsPhone(str(b,"phone")))throw new IllegalArgumentException("Số điện thoại đã tồn tại");long id=users.createStaff(str(b,"fullName"),str(b,"email"),str(b,"phone"),PasswordUtil.sha256(password),str(b,"role"));ok(ex,Map.of("id",id,"message","Đã tạo tài khoản nhân viên"));return;}
            if(path.startsWith("/api/users/")){
                String tail=path.substring("/api/users/".length());
                if(tail.endsWith("/password")&&method.equals("PUT")){long uid=Long.parseLong(tail.substring(0,tail.length()-9));Map<?,?> b=body(ex);String np=str(b,"newPassword");if(!users.checkPassword(uid,PasswordUtil.sha256(str(b,"currentPassword"))))throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");if(np.length()<6||!np.equals(str(b,"confirmPassword")))throw new IllegalArgumentException("Mật khẩu mới không hợp lệ");users.updatePassword(uid,PasswordUtil.sha256(np));ok(ex,Map.of("message","Đổi mật khẩu thành công"));return;}
                long uid=Long.parseLong(tail);
                if(method.equals("GET")){ok(ex,safeUser(users.findById(uid).orElseThrow()));return;}
                //if(method.equals("PUT")){Map<?,?> b=body(ex);String role=str(b,"role","CUSTOMER");validateRole(role);users.update(uid,str(b,"fullName"),str(b,"email"),str(b,"phone"),role,str(b,"status","ACTIVE"),str(b,"birthDate",""),str(b,"address",""),str(b,"avatarUrl",""));ok(ex,Map.of("message","Cập nhật tài khoản thành công"));return;}
                if(method.equals("PUT")){
                    Map<?,?> b = body(ex);

                    String fullName = str(b, "fullName");
                    String email = str(b, "email");
                    String phone = str(b, "phone");
                    String role = str(b, "role", "CUSTOMER");
                    String status = str(b, "status", "ACTIVE");
                    String birthDate = str(b, "birthDate", "");
                    String address = str(b, "address", "");
                    String avatarUrl = str(b, "avatarUrl", "");

                    if(fullName.isBlank())
                        throw new IllegalArgumentException("Họ và tên không được để trống");

                    if(email.isBlank())
                        throw new IllegalArgumentException("Email không được để trống");

                    validateRole(role);

                    // Không cho email trùng tài khoản khác
                    if(users.existsEmailExceptId(email, uid))
                        throw new IllegalArgumentException("Email đã tồn tại");

                    // Không cho số điện thoại trùng tài khoản khác
                    if(phone != null && !phone.isBlank()
                            && users.existsPhoneExceptId(phone, uid))
                        throw new IllegalArgumentException("Số điện thoại đã tồn tại");

                    users.update(
                            uid,
                            fullName,
                            email,
                            phone,
                            role,
                            status,
                            birthDate,
                            address,
                            avatarUrl
                    );

                    ok(ex, Map.of(
                            "message", "Cập nhật tài khoản thành công"
                    ));
                    return;
                }
                if(method.equals("DELETE")){if(hasUserHistory(uid))throw new IllegalArgumentException("Tài khoản đã có lịch sử giao dịch, chỉ được khóa tài khoản");users.delete(uid);ok(ex,Map.of("message","Đã xóa tài khoản"));return;}
            }

            if(path.equals("/api/foods")&&method.equals("GET")){ok(ex,foods(""));return;}
            if(path.equals("/api/foods")&&method.equals("POST")){long id=saveFood(body(ex),0);ok(ex,Map.of("id",id,"message","Đã thêm món ăn"));return;}
            if(path.startsWith("/api/foods/")){long fid=Long.parseLong(path.substring(11));if(method.equals("GET")){ok(ex,foodDetail(fid));return;}if(method.equals("PUT")){saveFood(body(ex),fid);ok(ex,Map.of("message","Đã cập nhật món ăn"));return;}if(method.equals("DELETE")){stopFood(fid);ok(ex,Map.of("message","Đã ngừng bán món ăn"));return;}}

            if(path.equals("/api/toppings")&&method.equals("GET")){ok(ex,toppings());return;}
            if(path.equals("/api/toppings")&&method.equals("POST")){long id=saveTopping(body(ex),0);ok(ex,Map.of("id",id));return;}
            if(path.startsWith("/api/toppings/")){long tid=Long.parseLong(path.substring(14));if(method.equals("PUT")){saveTopping(body(ex),tid);ok(ex,Map.of("message","Đã cập nhật topping"));return;}if(method.equals("DELETE")){update("UPDATE toppings SET status='STOPPED' WHERE id=?",tid);ok(ex,Map.of("message","Đã ngừng bán topping"));return;}}

            if(path.equals("/api/goods")&&method.equals("GET")){ok(ex,goods.all(queryParam(ex,"q")));return;}
            if(path.equals("/api/goods")&&method.equals("POST")){Good g=parseGood(body(ex));ok(ex,Map.of("id",goods.create(g)));return;}
            if(path.equals("/api/goods/low-stock")&&method.equals("GET")){ok(ex,goods.lowStock());return;}
            if(path.startsWith("/api/goods/")){long gid=Long.parseLong(path.substring(11));if(method.equals("PUT")){Good g=parseGood(body(ex));goods.update(gid,g);ok(ex,Map.of("message","Đã cập nhật hàng hóa"));return;}if(method.equals("DELETE")){checkGoodCanStop(gid);goods.stop(gid);ok(ex,Map.of("message","Đã ngừng sử dụng hàng hóa"));return;}}

            if(path.equals("/api/purchases")&&method.equals("GET")){ok(ex,purchases());return;}
            if(path.equals("/api/purchases")&&method.equals("POST")){ok(ex,createPurchase(body(ex)));return;}
            if(path.startsWith("/api/purchases/")&&path.endsWith("/confirm")&&method.equals("PUT")){long id=Long.parseLong(path.substring(15,path.length()-8));confirmPurchase(id);ok(ex,Map.of("message","Đã xác nhận phiếu nhập và cập nhật tồn kho"));return;}
            if(path.startsWith("/api/purchases/")&&method.equals("GET")){long id=Long.parseLong(path.substring(15));Map<String,Object> p=one("SELECT * FROM purchase_receipts WHERE id=?",id);if(p==null)throw new IllegalArgumentException("Không tìm thấy phiếu nhập");p.put("items",query("SELECT pri.*,g.code,g.name,g.unit FROM purchase_receipt_items pri JOIN goods g ON g.id=pri.good_id WHERE pri.receipt_id="+id));ok(ex,p);return;}
            if(path.startsWith("/api/purchases/")&&method.equals("PUT")){long id=Long.parseLong(path.substring(15));updatePurchase(id,body(ex));ok(ex,Map.of("message","Đã cập nhật phiếu nhập"));return;}

            // Lấy thực đơn hôm nay
            if(path.equals("/api/menus/today") && method.equals("GET")){
                ok(ex, menuToday());
                return;
            }

// Lấy danh sách thực đơn
            if(path.equals("/api/menus") && method.equals("GET")){
                ok(ex, menus());
                return;
            }

// Thêm thực đơn
            if(path.equals("/api/menus") && method.equals("POST")){
                ok(ex, saveMenu(body(ex), 0));
                return;
            }

// Xử lý chi tiết thực đơn
            if(path.startsWith("/api/menus/")){

                long mid = Long.parseLong(path.substring(11));

                // Lấy chi tiết thực đơn
                if(method.equals("GET")){

                    Map<String,Object> m = one(
                            "SELECT * FROM menus WHERE id=?",
                            mid
                    );

                    if(m == null){
                        throw new IllegalArgumentException("Không tìm thấy thực đơn");
                    }

                    // Lấy danh sách món ăn kèm đường dẫn ảnh
                    List<Map<String,Object>> foods = query(
                            "SELECT f.id, f.name, f.description, f.price, f.image_url " +
                                    "FROM menu_items mi " +
                                    "JOIN foods f ON f.id = mi.food_id " +
                                    "WHERE mi.menu_id = " + mid
                    );

                    // Danh sách ID món ăn
                    m.put(
                            "foodIds",
                            foods.stream()
                                    .map(x -> x.get("id"))
                                    .toList()
                    );

                    // Danh sách thông tin đầy đủ của món ăn
                    m.put("foods", foods);

                    ok(ex, m);
                    return;
                }

                // Cập nhật thực đơn
                if(method.equals("PUT")){
                    ok(ex, saveMenu(body(ex), mid));
                    return;
                }

                // Đóng thực đơn
                if(method.equals("DELETE")){
                    update(
                            "UPDATE menus SET status='CLOSED' WHERE id=?",
                            mid
                    );

                    ok(ex, Map.of("message", "Đã đóng thực đơn"));
                    return;
                }
            }

            if(path.equals("/api/orders")&&method.equals("GET")){ok(ex,orders(queryParam(ex,"customerId"),queryParam(ex,"q"),queryParam(ex,"status"),queryParam(ex,"paymentStatus"),queryParam(ex,"from"),queryParam(ex,"to")));return;}
            if(path.equals("/api/orders")&&method.equals("POST")){ok(ex,createOrder(body(ex)));return;}
            if(path.startsWith("/api/orders/")&&path.endsWith("/status")&&method.equals("PUT")){long oid=Long.parseLong(path.substring(12,path.length()-7));Map<?,?> b=body(ex);changeOrderStatus(oid,str(b,"status"),str(b,"reason",""),longVal(b,"changedBy",0));ok(ex,Map.of("message","Đã cập nhật trạng thái đơn hàng"));return;}
            if(path.startsWith("/api/orders/")&&method.equals("GET")){ok(ex,orderDetail(Long.parseLong(path.substring(12))));return;}
            if(path.startsWith("/api/orders/")&&method.equals("DELETE")){long oid=Long.parseLong(path.substring(12));Map<?,?> b=body(ex);cancelOrder(oid,str(b,"reason","Khách hàng hủy đơn"));ok(ex,Map.of("message","Đã hủy đơn hàng"));return;}

            if(path.equals("/api/payments")&&method.equals("POST")){confirmPayment(body(ex));ok(ex,Map.of("message","Đã xác nhận thanh toán"));return;}
            if(path.startsWith("/api/payments/order/")&&method.equals("GET")){ok(ex,payment(Long.parseLong(path.substring(20))));return;}
            if(path.startsWith("/api/payments/order/")&&method.equals("PUT")){refundPayment(Long.parseLong(path.substring(20)),body(ex));ok(ex,Map.of("message","Đã hoàn tiền"));return;}

            if(path.equals("/api/reports/revenue")){ok(ex,revenue(ex));return;}
            if(path.equals("/api/reports/orders")){ok(ex,orderStats(ex));return;}
            if(path.equals("/api/reports/best-selling")){ok(ex,bestSelling(ex));return;}
            if(path.equals("/api/reports/inventory")){ok(ex,inventoryReport());return;}
            if(path.equals("/api/reports/export")&&method.equals("GET")){exportReport(ex);return;}

            throw new IllegalArgumentException("API không tồn tại: "+method+" "+path);
        }catch(IllegalArgumentException e){error(ex,400,e.getMessage());}catch(SQLException e){e.printStackTrace();error(ex,500,"Lỗi database: "+e.getMessage());}catch(Exception e){e.printStackTrace();error(ex,500,"Lỗi hệ thống: "+e.getMessage());}
    }

    private Map<?,?> body(HttpExchange ex)throws IOException{return Json.parse(HttpUtil.body(ex),Map.class);}
    private String str(Map<?,?> b,String k){return str(b,k,"");}
    private String str(Map<?,?> b,String k,String d){Object v=b.get(k);return v==null?d:String.valueOf(v);}
    private long longVal(Map<?,?> b,String k,long d){Object v=b.get(k);if(v==null)return d;if(v instanceof Number n)return n.longValue();try{return Long.parseLong(String.valueOf(v));}catch(Exception e){return d;}}
    private double dbl(Object v){if(v instanceof Number n)return n.doubleValue();return Double.parseDouble(String.valueOf(v));}
    private String queryParam(HttpExchange ex,String k){String q=ex.getRequestURI().getRawQuery();if(q==null)return "";for(String p:q.split("&")){String[] a=p.split("=",2);if(a.length==2&&a[0].equals(k))try{return java.net.URLDecoder.decode(a[1],StandardCharsets.UTF_8);}catch(Exception ignored){}}return "";}
    private void validateRole(String r){if(!Set.of("CUSTOMER","STAFF","MANAGER").contains(r))throw new IllegalArgumentException("Vai trò không hợp lệ");}
    private Map<String,Object> safeUser(User u){Map<String,Object> m=new LinkedHashMap<>();m.put("id",u.id());m.put("fullName",u.fullName());m.put("email",u.email());m.put("phone",u.phone());m.put("role",u.role());m.put("status",u.status());m.put("birthDate",u.birthDate());m.put("address",u.address());m.put("avatarUrl",u.avatarUrl());return m;}
    private String token(HttpExchange ex){String h=ex.getRequestHeaders().getFirst("Authorization");return h!=null&&h.startsWith("Bearer ")?h.substring(7):null;}

    private List<Map<String,Object>> foods(String ignored)throws SQLException{return query("SELECT f.* FROM foods f ORDER BY f.id DESC");}
    private Map<String,Object> foodDetail(long fid)throws SQLException{Map<String,Object> f=one("SELECT * FROM foods WHERE id=?",fid);if(f==null)throw new IllegalArgumentException("Không tìm thấy món ăn");f.put("available",foodAvailable(fid));f.put("ingredients",query("SELECT fi.good_id,fi.quantity,g.code,g.name,g.unit FROM food_ingredients fi JOIN goods g ON g.id=fi.good_id WHERE fi.food_id="+fid));List<Map<String,Object>> ts=query("SELECT t.id,t.name,t.price,t.status FROM food_toppings ft JOIN toppings t ON t.id=ft.topping_id WHERE ft.food_id="+fid);for(Map<String,Object> t:ts)t.put("available",toppingAvailable(longVal(t,"id",0)));f.put("toppings",ts);return f;}
    private long saveFood(Map<?,?> b,long id)throws SQLException{String name=str(b,"name");double price=dbl(b.get("price"));if(name.isBlank()||price<=0)throw new IllegalArgumentException("Tên món và giá bán phải hợp lệ, giá > 0");List<?> ingredients=(b.get("ingredients") instanceof List<?> l ? l : List.of());if(ingredients.isEmpty())throw new IllegalArgumentException("Món ăn phải có ít nhất một nguyên liệu");for(Object o:ingredients){Map<?,?> x=(Map<?,?>)o;if(longVal(x,"goodId",0)<=0||dbl(x.get("quantity"))<=0)throw new IllegalArgumentException("Nguyên liệu và định lượng phải hợp lệ");if(one("SELECT id FROM goods WHERE id=? AND status='ACTIVE'",longVal(x,"goodId",0))==null)throw new IllegalArgumentException("Nguyên liệu không tồn tại hoặc đã ngừng sử dụng");}
        try(Connection c=Db.getConnection()){c.setAutoCommit(false);long fid=id;if(fid==0){try(PreparedStatement p=c.prepareStatement("INSERT INTO foods(name,description,category,price,image_url,status) VALUES(?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS)){p.setString(1,name);p.setString(2,str(b,"description"));p.setString(3,str(b,"category"));p.setDouble(4,price);p.setString(5,str(b,"imageUrl"));p.setString(6,str(b,"status","AVAILABLE"));p.executeUpdate();try(ResultSet r=p.getGeneratedKeys()){r.next();fid=r.getLong(1);}}}else{try(PreparedStatement p=c.prepareStatement("UPDATE foods SET name=?,description=?,category=?,price=?,image_url=?,status=? WHERE id=?")){p.setString(1,name);p.setString(2,str(b,"description"));p.setString(3,str(b,"category"));p.setDouble(4,price);p.setString(5,str(b,"imageUrl"));p.setString(6,str(b,"status","AVAILABLE"));p.setLong(7,fid);p.executeUpdate();}update(c,"DELETE FROM food_ingredients WHERE food_id=?",fid);update(c,"DELETE FROM food_toppings WHERE food_id=?",fid);}for(Object o:ingredients){Map<?,?> x=(Map<?,?>)o;insert(c,"INSERT INTO food_ingredients(food_id,good_id,quantity) VALUES(?,?,?)",fid,longVal(x,"goodId",0),dbl(x.get("quantity")));}List<?> toppings=(b.get("toppings") instanceof List<?> l ? l : List.of());for(Object o:toppings){long tid=o instanceof Number n?n.longValue():longVal((Map<?,?>)o,"toppingId",0);if(tid>0){if(one("SELECT id FROM toppings WHERE id=?",tid)==null)throw new IllegalArgumentException("Topping không tồn tại");insert(c,"INSERT INTO food_toppings(food_id,topping_id) VALUES(?,?)",fid,tid);}}c.commit();return fid;}}
    private void stopFood(long id)throws SQLException{update("UPDATE foods SET status='STOPPED' WHERE id=?",id);}
    private List<Map<String,Object>> toppings()throws SQLException{List<Map<String,Object>> l=query("SELECT t.* FROM toppings t ORDER BY t.id DESC");for(Map<String,Object> t:l){long tid=longVal(t,"id",0);t.put("available",toppingAvailable(tid));t.put("ingredients",query("SELECT ti.good_id,ti.quantity,g.code,g.name,g.unit FROM topping_ingredients ti JOIN goods g ON g.id=ti.good_id WHERE ti.topping_id="+tid));}return l;}
    private long saveTopping(Map<?,?> b,long id)throws SQLException{String name=str(b,"name");double price=dbl(b.get("price"));if(name.isBlank()||price<0)throw new IllegalArgumentException("Topping không hợp lệ");if(id==0){try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("INSERT INTO toppings(name,price,status) VALUES(?,?,?)",Statement.RETURN_GENERATED_KEYS)){p.setString(1,name);p.setDouble(2,price);p.setString(3,str(b,"status","AVAILABLE"));p.executeUpdate();try(ResultSet r=p.getGeneratedKeys()){r.next();return r.getLong(1);}}}update("UPDATE toppings SET name=?,price=?,status=? WHERE id=?",name,price,str(b,"status","AVAILABLE"),id);update("DELETE FROM topping_ingredients WHERE topping_id=?",id);Object arr=b.get("ingredients");if(!(arr instanceof List<?>))throw new IllegalArgumentException("Topping phải có ít nhất một nguyên liệu");List<?> list=(List<?>)arr;if(list.isEmpty())throw new IllegalArgumentException("Topping phải có ít nhất một nguyên liệu");for(Object o:list){Map<?,?> x=(Map<?,?>)o;long gid=longVal(x,"goodId",0);double q=dbl(x.get("quantity"));if(gid<=0||q<=0)throw new IllegalArgumentException("Nguyên liệu topping không hợp lệ");insert("INSERT INTO topping_ingredients(topping_id,good_id,quantity) VALUES(?,?,?)",id,gid,q);}return id;}

    private boolean foodAvailable(long fid)throws SQLException{Map<String,Object> f=one("SELECT status FROM foods WHERE id=?",fid);if(f==null||!"AVAILABLE".equals(f.get("status")))return false;return ingredientsAvailable("food_ingredients","food_id",fid);}
    private boolean toppingAvailable(long tid)throws SQLException{Map<String,Object> t=one("SELECT status FROM toppings WHERE id=?",tid);if(t==null||!"AVAILABLE".equals(t.get("status")))return false;return ingredientsAvailable("topping_ingredients","topping_id",tid);}
    private boolean ingredientsAvailable(String table,String fk,long id)throws SQLException{List<Map<String,Object>> rows=query("SELECT g.quantity,g.reserved_quantity,x.quantity need FROM "+table+" x JOIN goods g ON g.id=x.good_id WHERE x."+fk+"="+id+" AND g.status='ACTIVE'");if(rows.isEmpty())return true;for(Map<String,Object> r:rows)if(dbl(r.get("quantity"))-dbl(r.get("reserved_quantity"))<dbl(r.get("need")))return false;return true;}

    private List<Map<String,Object>> menus()throws SQLException{return query("SELECT m.*,COUNT(mi.id) food_count FROM menus m LEFT JOIN menu_items mi ON mi.menu_id=m.id GROUP BY m.id ORDER BY m.start_time DESC");}
    private Map<String,Object> menuToday()throws SQLException{List<Map<String,Object>> ms=query("SELECT * FROM menus WHERE status='PUBLISHED' AND NOW() BETWEEN start_time AND end_time ORDER BY start_time DESC");Map<String,Object> out=new LinkedHashMap<>();out.put("date",LocalDate.now().toString());if(ms.isEmpty()){out.put("menu",null);out.put("items",List.of());return out;}Map<String,Object> m=ms.get(0);long mid=longVal(m,"id",0);List<Map<String,Object>> items=query("SELECT f.id food_id,f.name food_name,f.description,f.category,f.price,f.image_url,f.status food_status FROM menu_items mi JOIN foods f ON f.id=mi.food_id WHERE mi.menu_id="+mid);for(Map<String,Object> f:items){long fid=longVal(f,"food_id",0);f.put("available",foodAvailable(fid));List<Map<String,Object>> ts=query("SELECT t.id,t.name,t.price,t.status FROM food_toppings ft JOIN toppings t ON t.id=ft.topping_id WHERE ft.food_id="+fid);for(Map<String,Object> t:ts)t.put("available",toppingAvailable(longVal(t,"id",0)));f.put("toppings",ts);}out.put("menu",m);out.put("items",items);return out;}
    private Map<String,Object> saveMenu(Map<?,?> b,long id)throws SQLException{String name=str(b,"name");String type=str(b,"menuType","Bữa trưa");String start=str(b,"startTime");String end=str(b,"endTime");if(name.isBlank()||start.isBlank()||end.isBlank())throw new IllegalArgumentException("Thông tin thực đơn chưa đủ");LocalDateTime s=parseDateTime(start),e=parseDateTime(end);if(!e.isAfter(s))throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu");List<?> fs=(b.get("foodIds") instanceof List<?> l ? l : List.of());for(Object o:fs){long fid=o instanceof Number n?n.longValue():Long.parseLong(String.valueOf(o));if(!foodAvailable(fid))throw new IllegalArgumentException("Món "+fid+" đang không khả dụng hoặc thiếu nguyên liệu");}try(Connection c=Db.getConnection()){c.setAutoCommit(false);long mid=id;if(mid==0){try(PreparedStatement p=c.prepareStatement("INSERT INTO menus(name,menu_type,start_time,end_time,status,created_by) VALUES(?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS)){p.setString(1,name);p.setString(2,type);p.setTimestamp(3,Timestamp.valueOf(s));p.setTimestamp(4,Timestamp.valueOf(e));p.setString(5,str(b,"status","DRAFT"));p.setLong(6,longVal(b,"createdBy",1));p.executeUpdate();try(ResultSet r=p.getGeneratedKeys()){r.next();mid=r.getLong(1);}}}else{try(PreparedStatement p=c.prepareStatement("UPDATE menus SET name=?,menu_type=?,start_time=?,end_time=?,status=? WHERE id=?")){p.setString(1,name);p.setString(2,type);p.setTimestamp(3,Timestamp.valueOf(s));p.setTimestamp(4,Timestamp.valueOf(e));p.setString(5,str(b,"status","DRAFT"));p.setLong(6,mid);p.executeUpdate();}update(c,"DELETE FROM menu_items WHERE menu_id=?",mid);}for(Object o:fs){long fid=o instanceof Number n?n.longValue():Long.parseLong(String.valueOf(o));insert(c,"INSERT INTO menu_items(menu_id,food_id) VALUES(?,?)",mid,fid);}c.commit();return Map.of("id",mid,"message",id==0?"Đã tạo thực đơn":"Đã cập nhật thực đơn");}}

    private Map<String,Object> createPurchase(Map<?,?> b)throws SQLException{String code=str(b,"receiptCode");if(code.isBlank())code="PN"+System.currentTimeMillis();List<?> items=(b.get("items") instanceof List<?> l ? l : List.of());if(items.isEmpty())throw new IllegalArgumentException("Phiếu nhập phải có mặt hàng");try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement("INSERT INTO purchase_receipts(receipt_code,supplier,receipt_date,status,total_amount,created_by) VALUES(?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS)){p.setString(1,code);p.setString(2,str(b,"supplier"));p.setTimestamp(3,Timestamp.valueOf(LocalDateTime.now()));p.setString(4,"DRAFT");p.setDouble(5,0);p.setLong(6,longVal(b,"createdBy",1));p.executeUpdate();long rid;try(ResultSet r=p.getGeneratedKeys()){r.next();rid=r.getLong(1);}double total=0;for(Object o:items){Map<?,?> x=(Map<?,?>)o;long gid=longVal(x,"goodId",0);double q=dbl(x.get("quantity")),price=dbl(x.get("unitPrice"));if(q<=0||price<0||one("SELECT id FROM goods WHERE id=?",gid)==null)throw new IllegalArgumentException("Chi tiết phiếu nhập không hợp lệ");insert(c,"INSERT INTO purchase_receipt_items(receipt_id,good_id,quantity,unit_price) VALUES(?,?,?,?)",rid,gid,q,price);total+=q*price;}update(c,"UPDATE purchase_receipts SET total_amount=? WHERE id=?",total,rid);return Map.of("id",rid,"receiptCode",code,"totalAmount",total);}}
    private void updatePurchase(long id,Map<?,?> b)throws SQLException{Map<String,Object> r=one("SELECT status FROM purchase_receipts WHERE id=?",id);if(r==null)throw new IllegalArgumentException("Không tìm thấy phiếu nhập");if(!"DRAFT".equals(r.get("status")))throw new IllegalArgumentException("Chỉ được sửa phiếu nháp");List<?> items=(b.get("items") instanceof List<?> l?l:List.of());if(items.isEmpty())throw new IllegalArgumentException("Phiếu nhập phải có ít nhất một mặt hàng");try(Connection c=Db.getConnection()){c.setAutoCommit(false);update(c,"UPDATE purchase_receipts SET supplier=? WHERE id=?",str(b,"supplier"),id);update(c,"DELETE FROM purchase_receipt_items WHERE receipt_id=?",id);double total=0;for(Object o:items){Map<?,?> x=(Map<?,?>)o;long gid=longVal(x,"goodId",0);double q=dbl(x.get("quantity")),price=dbl(x.get("unitPrice"));if(q<=0||price<0||one("SELECT id FROM goods WHERE id=?",gid)==null)throw new IllegalArgumentException("Chi tiết phiếu nhập không hợp lệ");insert(c,"INSERT INTO purchase_receipt_items(receipt_id,good_id,quantity,unit_price) VALUES(?,?,?,?)",id,gid,q,price);total+=q*price;}update(c,"UPDATE purchase_receipts SET total_amount=? WHERE id=?",total,id);c.commit();}}
    private void confirmPurchase(long id)throws SQLException{try(Connection c=Db.getConnection()){c.setAutoCommit(false);Map<String,Object> r=one("SELECT status FROM purchase_receipts WHERE id="+id);if(r==null||!"DRAFT".equals(r.get("status")))throw new IllegalArgumentException("Phiếu không ở trạng thái nháp");List<Map<String,Object>> items=query("SELECT * FROM purchase_receipt_items WHERE receipt_id="+id);for(Map<String,Object> x:items){long gid=longVal(x,"good_id",0);double q=dbl(x.get("quantity"));update(c,"UPDATE goods SET quantity=quantity+? WHERE id=?",q,gid);insert(c,"INSERT INTO inventory_transactions(good_id,transaction_type,quantity,reference_type,reference_id,note,created_by) VALUES(?,?,?,?,?,?,?)",gid,"IMPORT",q,"PURCHASE",id,"Xác nhận phiếu nhập",1);}update(c,"UPDATE purchase_receipts SET status='CONFIRMED' WHERE id=?",id);c.commit();}}
    private List<Map<String,Object>> purchases()throws SQLException{return query("SELECT p.*,u.full_name creator FROM purchase_receipts p LEFT JOIN users u ON u.id=p.created_by ORDER BY p.id DESC");}

    private List<Map<String,Object>> orders(String customerId,String qText,String status,String paymentStatus,String from,String to)throws SQLException{StringBuilder q=new StringBuilder("SELECT o.*,u.full_name customer_name,p.method payment_method FROM orders o JOIN users u ON u.id=o.customer_id LEFT JOIN payments p ON p.order_id=o.id WHERE 1=1");if(!customerId.isBlank())q.append(" AND o.customer_id=").append(Long.parseLong(customerId));if(!qText.isBlank()){String x=qText.replace("'","''");q.append(" AND (o.order_code LIKE '%").append(x).append("%' OR u.full_name LIKE '%").append(x).append("%')");}if(!status.isBlank())q.append(" AND o.status='").append(status.replace("'","''")).append("'");if(!paymentStatus.isBlank())q.append(" AND o.payment_status='").append(paymentStatus.replace("'","''")).append("'");if(!from.isBlank())q.append(" AND o.created_at>='").append(from).append(" 00:00:00'");if(!to.isBlank())q.append(" AND o.created_at<'").append(to).append(" 00:00:00'");q.append(" ORDER BY o.id DESC");return query(q.toString());}
    private Map<String,Object> createOrder(Map<?,?> b)throws SQLException{long customerId=longVal(b,"customerId",0);List<?> items=(b.get("items") instanceof List<?> l ? l : List.of());if(customerId<=0||items.isEmpty())throw new IllegalArgumentException("Thông tin đơn hàng không hợp lệ");Map<Long,Double> need=new HashMap<>();double total=0;try(Connection c=Db.getConnection()){c.setAutoCommit(false);for(Object o:items){Map<?,?> x=(Map<?,?>)o;long fid=longVal(x,"foodId",0);int qty=(int)longVal(x,"quantity",0);if(qty<=0)throw new IllegalArgumentException("Số lượng món phải lớn hơn 0");if(!foodAvailable(fid))throw new IllegalArgumentException("Món "+fid+" hiện không khả dụng");Map<String,Object> f=one("SELECT price FROM foods WHERE id="+fid);total+=dbl(f.get("price"))*qty;addIngredientNeeds(need,"food_ingredients","food_id",fid,qty);Object tids=x.get("toppingIds");if(tids instanceof List<?> tl)for(Object tv:tl){long tid=tv instanceof Number n?n.longValue():Long.parseLong(String.valueOf(tv));if(!toppingAvailable(tid))throw new IllegalArgumentException("Topping "+tid+" hiện không khả dụng");Map<String,Object> t=one("SELECT price FROM toppings WHERE id="+tid);total+=dbl(t.get("price"))*qty;addIngredientNeeds(need,"topping_ingredients","topping_id",tid,qty);}}
        for(Map.Entry<Long,Double> e:need.entrySet()){Map<String,Object> g=one("SELECT quantity,reserved_quantity,status FROM goods WHERE id="+e.getKey());if(g==null||!"ACTIVE".equals(g.get("status"))||dbl(g.get("quantity"))-dbl(g.get("reserved_quantity"))<e.getValue())throw new IllegalArgumentException("Không đủ tồn kho nguyên liệu");}
        String code="OD"+System.currentTimeMillis();long oid;try(PreparedStatement p=c.prepareStatement("INSERT INTO orders(order_code,customer_id,total_amount,status,payment_status,note,pickup_info) VALUES(?,?,?,'PENDING','UNPAID',?,?)",Statement.RETURN_GENERATED_KEYS)){p.setString(1,code);p.setLong(2,customerId);p.setDouble(3,total);p.setString(4,str(b,"note"));p.setString(5,str(b,"pickupInfo"));p.executeUpdate();try(ResultSet r=p.getGeneratedKeys()){r.next();oid=r.getLong(1);}}
        for(Object o:items){Map<?,?> x=(Map<?,?>)o;long fid=longVal(x,"foodId",0);int qty=(int)longVal(x,"quantity",0);Map<String,Object> f=one("SELECT price FROM foods WHERE id="+fid);long itemId;try(PreparedStatement p=c.prepareStatement("INSERT INTO order_items(order_id,food_id,quantity,unit_price,subtotal,note) VALUES(?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS)){double unit=dbl(f.get("price"));p.setLong(1,oid);p.setLong(2,fid);p.setInt(3,qty);p.setDouble(4,unit);p.setDouble(5,unit*qty);p.setString(6,str(x,"note"));p.executeUpdate();try(ResultSet r=p.getGeneratedKeys()){r.next();itemId=r.getLong(1);}}Object tids=x.get("toppingIds");if(tids instanceof List<?> tl)for(Object tv:tl){long tid=tv instanceof Number n?n.longValue():Long.parseLong(String.valueOf(tv));Map<String,Object> t=one("SELECT price FROM toppings WHERE id="+tid);double tp=dbl(t.get("price"));insert(c,"INSERT INTO order_item_toppings(order_item_id,topping_id,quantity,unit_price,subtotal) VALUES(?,?,?,?,?)",itemId,tid,qty,tp,tp*qty);}}
        for(Map.Entry<Long,Double> e:need.entrySet()){update(c,"UPDATE goods SET reserved_quantity=reserved_quantity+? WHERE id=?",e.getValue(),e.getKey());insert(c,"INSERT INTO inventory_transactions(good_id,transaction_type,quantity,reference_type,reference_id,note,created_by) VALUES(?,?,?,?,?,?,?)",e.getKey(),"RESERVE",e.getValue(),"ORDER",oid,"Giữ chỗ nguyên liệu cho đơn",customerId);}
        insert(c,"INSERT INTO payments(order_id,method,amount,status) VALUES(?,?,?,'PENDING')",oid,str(b,"paymentMethod","CASH"),total);insert(c,"INSERT INTO order_status_history(order_id,old_status,new_status,changed_by) VALUES(?,?,?,?)",oid,null,"PENDING",customerId);c.commit();return Map.of("id",oid,"orderCode",code,"totalAmount",total,"status","PENDING");}}
    private void addIngredientNeeds(Map<Long,Double> need,String table,String fk,long id,int multiplier)throws SQLException{for(Map<String,Object> r:query("SELECT good_id,quantity FROM "+table+" WHERE "+fk+"="+id)){long gid=longVal(r,"good_id",0);need.merge(gid,dbl(r.get("quantity"))*multiplier,Double::sum);}}
    private Map<String,Object> orderDetail(long id)throws SQLException{Map<String,Object> o=one("SELECT o.*,u.full_name customer_name FROM orders o JOIN users u ON u.id=o.customer_id WHERE o.id=?",id);if(o==null)throw new IllegalArgumentException("Không tìm thấy đơn");List<Map<String,Object>> items=query("SELECT oi.*,f.name food_name FROM order_items oi JOIN foods f ON f.id=oi.food_id WHERE oi.order_id="+id);for(Map<String,Object> i:items)i.put("toppings",query("SELECT oit.*,t.name topping_name FROM order_item_toppings oit JOIN toppings t ON t.id=oit.topping_id WHERE oit.order_item_id="+longVal(i,"id",0)));o.put("items",items);o.put("history",query("SELECT h.*,u.full_name changed_by_name FROM order_status_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.order_id="+id+" ORDER BY h.id"));o.put("payment",payment(id));return o;}
    private void changeOrderStatus(long id,String next,String reason,long by)throws SQLException{Map<String,Object> o=one("SELECT status,payment_status FROM orders WHERE id=?",id);if(o==null)throw new IllegalArgumentException("Không tìm thấy đơn");String cur=String.valueOf(o.get("status"));Map<String,String> allowed=Map.of("PENDING","CONFIRMED,CANCELLED","CONFIRMED","PREPARING,CANCELLED","PREPARING","READY,CANCELLED","READY","COMPLETED,CANCELLED");if(!Arrays.asList(allowed.getOrDefault(cur,"").split(",")).contains(next))throw new IllegalArgumentException("Không thể chuyển "+cur+" sang "+next);if("COMPLETED".equals(next)&&!"PAID".equals(o.get("payment_status")))throw new IllegalArgumentException("Đơn phải thanh toán trước khi hoàn thành");if("CANCELLED".equals(next)){cancelOrder(id,reason);return;}update("UPDATE orders SET status=?,completed_at=IF(?='COMPLETED',NOW(),completed_at) WHERE id=?",next,next,id);insert("INSERT INTO order_status_history(order_id,old_status,new_status,reason,changed_by) VALUES(?,?,?,?,?)",id,cur,next,reason,by);if("COMPLETED".equals(next))consumeReservation(id,by);}
    private void cancelOrder(long id,String reason)throws SQLException{Map<String,Object> o=one("SELECT status FROM orders WHERE id=?",id);if(o==null)throw new IllegalArgumentException("Không tìm thấy đơn");if(!"PENDING".equals(o.get("status")))throw new IllegalArgumentException("Chỉ được hủy đơn đang Chờ xác nhận");releaseReservation(id);update("UPDATE orders SET status='CANCELLED',payment_status='CANCELLED',cancel_reason=?,cancelled_at=NOW() WHERE id=?",reason,id);update("UPDATE payments SET status='CANCELLED' WHERE order_id=?",id);insert("INSERT INTO order_status_history(order_id,old_status,new_status,reason) VALUES(?,?,?,?)",id,"PENDING","CANCELLED",reason);}
    private void releaseReservation(long oid)throws SQLException{for(Map<String,Object> r:query("SELECT good_id,quantity FROM inventory_transactions WHERE transaction_type='RESERVE' AND reference_type='ORDER' AND reference_id="+oid)){update("UPDATE goods SET reserved_quantity=GREATEST(0,reserved_quantity-?) WHERE id=?",dbl(r.get("quantity")),longVal(r,"good_id",0));insert("INSERT INTO inventory_transactions(good_id,transaction_type,quantity,reference_type,reference_id,note) VALUES(?,?,?,?,?,?)",longVal(r,"good_id",0),"RELEASE",dbl(r.get("quantity")),"ORDER",oid,"Giải phóng giữ chỗ");}}
    private void consumeReservation(long oid,long by)throws SQLException{for(Map<String,Object> r:query("SELECT good_id,quantity FROM inventory_transactions WHERE transaction_type='RESERVE' AND reference_type='ORDER' AND reference_id="+oid)){long gid=longVal(r,"good_id",0);double q=dbl(r.get("quantity"));update("UPDATE goods SET quantity=quantity-?,reserved_quantity=GREATEST(0,reserved_quantity-?) WHERE id=?",q,q,gid);insert("INSERT INTO inventory_transactions(good_id,transaction_type,quantity,reference_type,reference_id,note,created_by) VALUES(?,?,?,?,?,?,?)",gid,"USE",q,"ORDER",oid,"Xuất sử dụng nguyên liệu",by);}}

    private Map<String,Object> payment(long orderId)throws SQLException{return one("SELECT p.*,u.full_name confirmed_by_name FROM payments p LEFT JOIN users u ON u.id=p.confirmed_by WHERE p.order_id=?",orderId);}
    private void confirmPayment(Map<?,?> b)throws SQLException{long oid=longVal(b,"orderId",0);Map<String,Object> o=one("SELECT total_amount,status FROM orders WHERE id=?",oid);if(o==null)throw new IllegalArgumentException("Không tìm thấy đơn");if("CANCELLED".equals(o.get("status")))throw new IllegalArgumentException("Đơn đã hủy");double amount=dbl(b.get("amount"));if(amount<dbl(o.get("total_amount")))throw new IllegalArgumentException("Số tiền thanh toán chưa đủ");String method=str(b,"method","CASH");if(!Set.of("CASH","QR","BANK_TRANSFER").contains(method))throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ");update("UPDATE payments SET method=?,amount=?,status='PAID',transaction_code=?,confirmed_by=?,paid_at=NOW() WHERE order_id=?",method,amount,str(b,"transactionCode"),longVal(b,"confirmedBy",1),oid);update("UPDATE orders SET payment_status='PAID' WHERE id=?",oid);}
    private void refundPayment(long oid,Map<?,?> b)throws SQLException{Map<String,Object> o=one("SELECT status,payment_status FROM orders WHERE id=?",oid);if(o==null||!"PAID".equals(o.get("payment_status")))throw new IllegalArgumentException("Đơn chưa thanh toán");if("COMPLETED".equals(o.get("status")))throw new IllegalArgumentException("Không được sửa thanh toán của đơn đã hoàn thành");update("UPDATE payments SET status='REFUNDED' WHERE order_id=?",oid);update("UPDATE orders SET payment_status='REFUNDED' WHERE id=?",oid);}

    private Map<String,Object> revenue(HttpExchange ex)throws SQLException{String[] d=dateRange(ex);Map<String,Object> r=one("SELECT COALESCE(SUM(total_amount),0) revenue,COUNT(*) order_count FROM orders WHERE payment_status='PAID' AND created_at>=? AND created_at<?",Timestamp.valueOf(d[0]),Timestamp.valueOf(d[1]));return r;}
    private List<Map<String,Object>> orderStats(HttpExchange ex)throws SQLException{String[] d=dateRange(ex);return query("SELECT status,COUNT(*) count FROM orders WHERE created_at>='"+d[0]+"' AND created_at<'"+d[1]+"' GROUP BY status ORDER BY count DESC");}
    private List<Map<String,Object>> bestSelling(HttpExchange ex)throws SQLException{String[] d=dateRange(ex);int limit=5;try{limit=Integer.parseInt(queryParam(ex,"limit"));}catch(Exception ignored){}limit=Math.max(1,Math.min(20,limit));return query("SELECT f.id,f.name,SUM(oi.quantity) quantity FROM order_items oi JOIN foods f ON f.id=oi.food_id JOIN orders o ON o.id=oi.order_id WHERE o.payment_status='PAID' AND o.created_at>='"+d[0]+"' AND o.created_at<'"+d[1]+"' GROUP BY f.id,f.name ORDER BY quantity DESC LIMIT "+limit);}
    private List<Map<String,Object>> inventoryReport()throws SQLException{return query("SELECT id,code,name,group_name,unit,quantity,reserved_quantity,(quantity-reserved_quantity) available_quantity,min_quantity,status FROM goods ORDER BY available_quantity ASC");}
    private String[] dateRange(HttpExchange ex){String from=queryParam(ex,"from"),to=queryParam(ex,"to");if(from.isBlank())from=LocalDate.now().withDayOfMonth(1).toString();if(to.isBlank())to=LocalDate.now().plusDays(1).toString();return new String[]{from+" 00:00:00",to+" 00:00:00"};}

    private boolean hasUserHistory(long uid)throws SQLException{return one("SELECT 1 x FROM orders WHERE customer_id=? LIMIT 1",uid)!=null||one("SELECT 1 x FROM inventory_transactions WHERE created_by=? LIMIT 1",uid)!=null||one("SELECT 1 x FROM purchase_receipts WHERE created_by=? LIMIT 1",uid)!=null;}
    private void checkGoodCanStop(long gid)throws SQLException{Map<String,Object> g=one("SELECT quantity,reserved_quantity FROM goods WHERE id=?",gid);if(g!=null&&(dbl(g.get("quantity"))>0||dbl(g.get("reserved_quantity"))>0))throw new IllegalArgumentException("Không thể ngừng sử dụng khi còn tồn hoặc đang giữ chỗ");if(!query("SELECT id FROM food_ingredients WHERE good_id="+gid+" UNION SELECT id FROM topping_ingredients WHERE good_id="+gid).isEmpty())throw new IllegalArgumentException("Hàng hóa đang được tham chiếu trong công thức");}
    private Good parseGood(Map<?,?> b){return new Good(longVal(b,"id",0),str(b,"code"),str(b,"name"),str(b,"groupName"),str(b,"unit"),dbl(b.get("quantity")==null?0:b.get("quantity")),dbl(b.get("reservedQuantity")==null?0:b.get("reservedQuantity")),dbl(b.get("minQuantity")==null?0:b.get("minQuantity")),str(b,"supplier"),str(b,"status","ACTIVE"));}

    private LocalDateTime parseDateTime(String s){try{return LocalDateTime.parse(s,DT);}catch(Exception e){try{return LocalDateTime.parse(s); }catch(Exception x){throw new IllegalArgumentException("Thời gian không hợp lệ: "+s);}}}
    private void insert(String sql,Object... args)throws SQLException{try(Connection c=Db.getConnection()){insert(c,sql,args);}}
    private void insert(Connection c,String sql,Object... args)throws SQLException{try(PreparedStatement p=c.prepareStatement(sql)){bind(p,args);p.executeUpdate();}}
    private void update(String sql,Object... args)throws SQLException{try(Connection c=Db.getConnection()){update(c,sql,args);}}
    private void update(Connection c,String sql,Object... args)throws SQLException{try(PreparedStatement p=c.prepareStatement(sql)){bind(p,args);p.executeUpdate();}}
    private void bind(PreparedStatement p,Object... args)throws SQLException{for(int i=0;i<args.length;i++){Object a=args[i];if(a==null)p.setNull(i+1,Types.NULL);else if(a instanceof Number n)p.setDouble(i+1,n.doubleValue());else p.setString(i+1,String.valueOf(a));}}
    private Map<String,Object> one(String sql,Object... args)throws SQLException{try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(sql)){bind(p,args);try(ResultSet r=p.executeQuery()){if(!r.next())return null;return row(r);}}}
    private List<Map<String,Object>> query(String sql)throws SQLException{try(Connection c=Db.getConnection();PreparedStatement p=c.prepareStatement(sql);ResultSet r=p.executeQuery()){List<Map<String,Object>> l=new ArrayList<>();while(r.next())l.add(row(r));return l;}}
    private Map<String,Object> row(ResultSet r)throws SQLException{Map<String,Object> m=new LinkedHashMap<>();ResultSetMetaData md=r.getMetaData();for(int i=1;i<=md.getColumnCount();i++)m.put(md.getColumnLabel(i),r.getObject(i));return m;}

    private void exportReport(HttpExchange ex)throws IOException,SQLException{String type=queryParam(ex,"type");String file="report-"+type+"-"+LocalDate.now();if("pdf".equalsIgnoreCase(type)){byte[] b=makePdf(reportText());
        ex.getResponseHeaders().set("Content-Type","application/pdf");ex.getResponseHeaders().set("Content-Disposition","attachment; filename="+file+".pdf");ex.sendResponseHeaders(200,b.length);try(OutputStream os=ex.getResponseBody()){os.write(b);}return;}byte[] b=makeXlsx(reportText());ex.getResponseHeaders().set("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");ex.getResponseHeaders().set("Content-Disposition","attachment; filename="+file+".xlsx");ex.sendResponseHeaders(200,b.length);try(OutputStream os=ex.getResponseBody()){os.write(b);}}
    private String reportText()throws SQLException{StringBuilder s=new StringBuilder("CANTEEN REPORT\n\n");s.append("Doanh thu\n").append(Json.stringify(revenueStub())).append("\n\nĐơn hàng\n").append(Json.stringify(query("SELECT status,COUNT(*) count FROM orders GROUP BY status"))).append("\n\nMón bán chạy\n").append(Json.stringify(query("SELECT f.name,SUM(oi.quantity) quantity FROM order_items oi JOIN foods f ON f.id=oi.food_id JOIN orders o ON o.id=oi.order_id WHERE o.payment_status='PAID' GROUP BY f.id,f.name ORDER BY quantity DESC LIMIT 20"))).append("\n\nTồn kho\n").append(Json.stringify(inventoryReport()));return s.toString();}
    private Map<String,Object> revenueStub()throws SQLException{return one("SELECT COALESCE(SUM(total_amount),0) revenue,COUNT(*) order_count FROM orders WHERE payment_status='PAID'");}
    private byte[] makeXlsx(String text)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();try(ZipOutputStream z=new ZipOutputStream(out,StandardCharsets.UTF_8)){zip(z,"[Content_Types].xml","<?xml version=\"1.0\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>");zip(z,"_rels/.rels","<?xml version=\"1.0\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");zip(z,"xl/workbook.xml","<?xml version=\"1.0\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"BaoCao\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");zip(z,"xl/_rels/workbook.xml.rels","<?xml version=\"1.0\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>");StringBuilder sh=new StringBuilder("<?xml version=\"1.0\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");int row=1;for(String line:text.split("\\n",-1)){sh.append("<row r=\"").append(row++).append("\"><c r=\"A").append(row-1).append("\" t=\"inlineStr\"><is><t>").append(xml(line)).append("</t></is></c></row>");}sh.append("</sheetData></worksheet>");zip(z,"xl/worksheets/sheet1.xml",sh.toString());}return out.toByteArray();}
    private void zip(ZipOutputStream z,String name,String content)throws IOException{z.putNextEntry(new ZipEntry(name));z.write(content.getBytes(StandardCharsets.UTF_8));z.closeEntry();}
    private String xml(String s){return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;");}
    private byte[] makePdf(String text)throws IOException{String safe=text.replace("\\","\\\\").replace("(","\\(").replace(")","\\)").replace("\r","");StringBuilder stream=new StringBuilder("BT /F1 9 Tf 40 800 Td ");String[] lines=safe.split("\\n");int i=0;for(String line:lines){if(i++>0)stream.append("0 -12 Td ");stream.append("(").append(line.length()>115?line.substring(0,115):line).append(") Tj ");if(i>55)break;}stream.append("ET");byte[] ss=stream.toString().getBytes(StandardCharsets.ISO_8859_1);ByteArrayOutputStream o=new ByteArrayOutputStream();List<Integer> off=new ArrayList<>();write(o,"%PDF-1.4\n");off.add(0);off.add(o.size());write(o,"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n");off.add(o.size());write(o,"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n");off.add(o.size());write(o,"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 842]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>endobj\n");off.add(o.size());write(o,"4 0 obj<</Length "+ss.length+">>stream\n");o.write(ss);write(o,"\nendstream endobj\n");off.add(o.size());write(o,"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n");int xref=o.size();write(o,"xref\n0 6\n0000000000 65535 f \n");for(int j=1;j<=5;j++)write(o,String.format("%010d 00000 n \n",off.get(j)));write(o,"trailer<</Size 6/Root 1 0 R>>\nstartxref\n"+xref+"\n%%EOF");return o.toByteArray();}
    private void write(OutputStream o,String s)throws IOException{o.write(s.getBytes(StandardCharsets.ISO_8859_1));}

    private void ok(HttpExchange ex,Object data)throws IOException{HttpUtil.send(ex,200,data);}private void error(HttpExchange ex,int status,String msg)throws IOException{HttpUtil.send(ex,status,Map.of("message",msg==null?"Lỗi":msg));}
}