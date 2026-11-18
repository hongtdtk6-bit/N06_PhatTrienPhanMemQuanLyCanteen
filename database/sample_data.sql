USE canteen_db;

INSERT INTO users(full_name,email,phone,password_hash,role,status) VALUES
('Nguyễn Minh Hồng','manager@canteen.local','0900000001',SHA2('123456',256),'MANAGER','ACTIVE'),
('Phan Thị Thanh Hương','staff@canteen.local','0900000002',SHA2('123456',256),'STAFF','ACTIVE'),
('Phí Thị Thu Hường','customer@canteen.local','0900000003',SHA2('123456',256),'CUSTOMER','ACTIVE');

INSERT INTO goods(code,name,group_name,unit,quantity,reserved_quantity,min_quantity,supplier,status) VALUES
('G001','Thịt bò','Thịt','kg',18,0,5,'Nhà cung cấp A','ACTIVE'),
('G002','Thịt gà','Thịt','kg',15,0,4,'Nhà cung cấp B','ACTIVE'),
('G003','Bún tươi','Tinh bột','kg',12,0,3,'Nhà cung cấp C','ACTIVE'),
('G004','Mì','Tinh bột','kg',10,0,3,'Nhà cung cấp C','ACTIVE'),
('G005','Đào ngâm','Đồ uống','lon',8,0,2,'Nhà cung cấp D','ACTIVE'),
('G006','Trứng','Topping','quả',40,0,10,'Nhà cung cấp E','ACTIVE'),
('G007','Quẩy','Topping','cái',50,0,10,'Nhà cung cấp F','ACTIVE'),
('G008','Rau sống','Rau','kg',8,0,2,'Nhà cung cấp G','ACTIVE'),
('G009','Cam','Trái cây','kg',6,0,1,'Nhà cung cấp H','ACTIVE');

INSERT INTO foods(name,description,category,price,status) VALUES
('Phở bò','Phở bò truyền thống','Món nước',35000,'AVAILABLE'),
('Cơm gà','Cơm gà sốt tiêu','Cơm',32000,'AVAILABLE'),
('Bún thịt nướng','Bún thịt nướng rau sống','Bún',30000,'AVAILABLE'),
('Mì xào bò','Mì xào bò rau củ','Mì',33000,'AVAILABLE'),
('Trà đào','Trà đào cam sả','Đồ uống',18000,'AVAILABLE');

INSERT INTO toppings(name,price,status) VALUES
('Trứng',5000,'AVAILABLE'),('Quẩy',3000,'AVAILABLE'),('Thịt thêm',10000,'AVAILABLE');

INSERT INTO food_ingredients(food_id,good_id,quantity) VALUES
(1,1,0.10),(1,8,0.02),(2,2,0.15),(3,3,0.20),(3,8,0.03),(4,4,0.15),(4,1,0.08),(5,5,0.10),(5,9,0.03);
INSERT INTO topping_ingredients(topping_id,good_id,quantity) VALUES
(1,6,1),(2,7,1),(3,1,0.05);
INSERT INTO food_toppings(food_id,topping_id) VALUES
(1,1),(1,2),(1,3),(2,1),(2,3),(3,1),(3,2),(4,1);

INSERT INTO menus(name,menu_type,start_time,end_time,status,created_by)
VALUES('Thực đơn hôm nay','Bữa trưa',TIMESTAMP(CURDATE(),'06:00:00'),TIMESTAMP(CURDATE(),'21:00:00'),'PUBLISHED',1);
INSERT INTO menu_items(menu_id,food_id) VALUES(1,1),(1,2),(1,3),(1,5);

