# BÀI TẬP LỚN MÔN PHÂN TÍCH VÀ THIẾT KẾ PHẦN MỀM

## Đề tài
PHÁT TRIỂN PHẦN MỀM QUẢN LÝ CANTEEN

## Giảng viên hướng dẫn
MAI THÚY NGA

## Thành viên nhóm
24100433 - Nguyễn Minh Hồng (Nhóm trưởng)<br>
24100069 - Phí Thị Thu Hường<br>
24106287 - Phan Thị Thanh Hương<br>
24100070 - Lại Cao Thắng<br>

## Cấu trúc
- `database/schema.sql`: tạo CSDL đầy đủ cho R1-R8.
- `database/sample_data.sql`: dữ liệu mẫu.
- `backend`: Java HttpServer + MySQL + Gson.
- `frontend`: giao diện HTML/CSS/JavaScript.

## Tài khoản mẫu
- Quản lý: `manager@canteen.local` / `123456`
- Nhân viên: `staff@canteen.local` / `123456`
- Khách hàng: `customer@canteen.local` / `123456`

## Chạy database
1. Mở MySQL Workbench.
2. Chạy `database/schema.sql`.
3. Chạy `database/sample_data.sql`.

## Chạy backend
JDK 26 + Maven:
```bash
cd backend
mvn clean package
java -jar target/canteen-backend-1.0.0.jar
```
Mặc định API chạy tại `http://localhost:8080`.

Có thể đổi kết nối DB bằng biến môi trường `DB_URL`, `DB_USER`, `DB_PASSWORD`.

## Chạy frontend
Mở `frontend/index.html` bằng Live Server hoặc web server tĩnh.
