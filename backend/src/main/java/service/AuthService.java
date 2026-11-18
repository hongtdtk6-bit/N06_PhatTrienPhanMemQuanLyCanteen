package service;

import repository.UserRepository;
import utils.PasswordUtil;
import model.User;
import java.sql.SQLException;
import java.util.Optional;

public class AuthService {
    private final UserRepository repo=new UserRepository();
    public User login(String identifier,String password)throws SQLException{
        Optional<User> u=repo.login(identifier, PasswordUtil.sha256(password));
        if(u.isEmpty()) throw new IllegalArgumentException("Email/số điện thoại hoặc mật khẩu không đúng, hoặc tài khoản đang bị khóa");
        return u.get();
    }
    public long register(String fullName,String email,String phone,String password)throws SQLException{
        if(fullName==null||fullName.isBlank()||email==null||email.isBlank()||phone==null||phone.isBlank()||password==null||password.length()<6)
            throw new IllegalArgumentException("Thông tin đăng ký không hợp lệ");
        if(repo.existsEmail(email)) throw new IllegalArgumentException("Email đã tồn tại");
        if(repo.existsPhone(phone)) throw new IllegalArgumentException("Số điện thoại đã tồn tại");
        return repo.create(fullName,email,phone,PasswordUtil.sha256(password));
    }
}
