const state={user:JSON.parse(localStorage.getItem("canteenUser")||"null"),cart:[]};
const navItems={
 CUSTOMER:[["dashboard","🏠","Tổng quan"],["menu","🍜","Thực đơn hôm nay"],["foods","🍱","Món ăn"],["cart","🛒","Giỏ hàng"],["orders","📋","Đơn hàng"],["profile","👤","Tài khoản"]],
 STAFF:[["dashboard","🏠","Tổng quan"],["foods","🍱","Quản lý món ăn"],["toppings","➕","Topping"],["menus","📋","Thực đơn"],["goods","📦","Hàng hóa"],["purchases","🚚","Nhập hàng"],["inventory","🧮","Tồn kho"],["orders","🧾","Xử lý đơn hàng"],["payments","💳","Thanh toán"],["profile","👤","Tài khoản"]],
 MANAGER:[["dashboard","🏠","Tổng quan"],["foods","🍱","Quản lý món ăn"],["toppings","➕","Topping"],["menus","📋","Quản lý thực đơn"],["goods","📦","Hàng hóa"],["purchases","🚚","Nhập hàng"],["inventory","🧮","Tồn kho"],["orders","🧾","Đơn hàng"],["payments","💳","Thanh toán"],["users","👥","Tài khoản nhân viên"],["reports","📊","Thống kê & báo cáo"],["profile","👤","Tài khoản"]]
};

document.addEventListener("DOMContentLoaded",()=>{
 document.getElementById("loginForm").addEventListener("submit",login);
 document.getElementById("registerForm").addEventListener("submit",register);
 document.getElementById("selectedRole").addEventListener("change",updateRegisterVisibility);
 updateRegisterVisibility(); state.user?showApp():showLogin();
});
function roleName(r){return {CUSTOMER:"Khách hàng",STAFF:"Nhân viên",MANAGER:"Quản lý"}[r]||r}
function updateRegisterVisibility(){const c=document.getElementById("selectedRole").value==="CUSTOMER";document.getElementById("customerRegister").classList.toggle("hidden",!c);if(!c)showLoginForm()}
function showLogin(){document.getElementById("loginView").classList.remove("hidden");document.getElementById("mainView").classList.add("hidden")}
function showLoginForm(){document.getElementById("loginForm").classList.remove("hidden");document.getElementById("registerForm").classList.add("hidden");document.getElementById("loginMsg").textContent=""}
function showRegister(){document.getElementById("loginForm").classList.add("hidden");document.getElementById("registerForm").classList.remove("hidden");document.getElementById("loginMsg").textContent=""}
async function login(e){e.preventDefault();try{const r=await api("/auth/login",{method:"POST",body:JSON.stringify({identifier:email.value,password:password.value})});if(r.user.role!==selectedRole.value){throw new Error("Vai trò đăng nhập không khớp với tài khoản")};state.user=r.user;localStorage.setItem("canteenUser",JSON.stringify(r.user));localStorage.setItem("canteenToken",r.token);showApp()}catch(err){loginMsg.textContent=err.message}}
async function register(e){e.preventDefault();try{if(regPassword.value!==regConfirmPassword.value)throw new Error("Mật khẩu xác nhận không khớp");await api("/auth/register",{method:"POST",body:JSON.stringify({fullName:regFullName.value,email:regEmail.value,phone:regPhone.value,password:regPassword.value})});alert("Đăng ký thành công. Hãy đăng nhập.");showLoginForm()}catch(err){alert(err.message)}}
async function logout(){try{await api("/auth/logout",{method:"POST"})}catch(_){}localStorage.removeItem("canteenUser");localStorage.removeItem("canteenToken");state.user=null;state.cart=[];showLogin()}
function showApp(){document.getElementById("loginView").classList.add("hidden");document.getElementById("mainView").classList.remove("hidden");document.getElementById("userBox").textContent=state.user.fullName+" - "+roleName(state.user.role);document.getElementById("roleBadge").textContent=roleName(state.user.role);document.getElementById("nav").innerHTML=navItems[state.user.role].map(x=>`<button id="nav-${x[0]}" onclick="go('${x[0]}')">${x[1]} ${x[2]}</button>`).join("");go("dashboard")}
function go(page){document.querySelectorAll("#nav button").forEach(x=>x.classList.remove("active"));const n=document.getElementById("nav-"+page);if(n)n.classList.add("active");document.getElementById("pageTitle").textContent=(navItems[state.user.role]||[]).find(x=>x[0]===page)?.[2]||page;const fn={dashboard,menu,foods,cart,orders,profile,toppings,menus,goods,purchases,inventory,users,payments,reports}[page];if(fn)fn()}
function money(n){return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(Number(n)||0)}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmt(x){return x?new Date(x).toLocaleString("vi-VN"):""}
function statusText(s){return {AVAILABLE:"Đang bán",STOPPED:"Ngừng bán",ACTIVE:"Đang sử dụng",INACTIVE:"Đã khóa",PENDING:"Chờ xác nhận",CONFIRMED:"Đã xác nhận",PREPARING:"Đang chuẩn bị",READY:"Sẵn sàng nhận",COMPLETED:"Hoàn thành",CANCELLED:"Đã hủy",PAID:"Đã thanh toán",UNPAID:"Chưa thanh toán",REFUNDED:"Đã hoàn tiền",DRAFT:"Nháp",PUBLISHED:"Đã công bố",CLOSED:"Đã đóng"}[s]||s}
//function dashboard(){const customer=state.user.role==="CUSTOMER";document.getElementById("page").innerHTML=`<div class="grid"><div class="card"><div class="muted2">Xin chào</div><div class="stat">${esc(state.user.fullName)}</div><p>${roleName(state.user.role)}</p></div><div class="card"><div class="muted2">Chức năng chính</div><p>${customer?"Xem thực đơn, chọn món, giỏ hàng và theo dõi đơn hàng.":"Quản lý món ăn, kho, đơn hàng, thanh toán và báo cáo."}</p></div></div>${customer?`<div class="card" style="margin-top:15px"><h3>Thực đơn hôm nay</h3><button onclick="go('menu')">Xem thực đơn</button></div>`:`<div class="card" style="margin-top:15px"><h3>Truy cập nhanh</h3><div class="actions"><button onclick="go('foods')">Quản lý món</button><button onclick="go('inventory')">Kiểm tra tồn kho</button><button onclick="go('orders')">Xử lý đơn</button></div></div>`}`}
async function dashboard() {
  const role = state.user.role;

  try {

    // =====================================================
    // 1. KHÁCH HÀNG
    // =====================================================
    if (role === "CUSTOMER") {

      const [orders, menus] = await Promise.all([
        api("/orders?customerId=" + state.user.id),
        api("/menus")
      ]);

      const publishedMenus = (menus || []).filter(
        m => m.status === "PUBLISHED"
      );

      const pendingOrders = (orders || []).filter(
        o => ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(o.status)
      );

      const completedOrders = (orders || []).filter(
        o => o.status === "COMPLETED"
      );

      const cartCount = state.cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      document.getElementById("page").innerHTML = `

        <div class="dashboard-welcome">
          <div>
            <div class="dashboard-subtitle">Xin chào</div>
            <h2>${esc(state.user.fullName || "Khách hàng")} 👋</h2>
            <p>Chào mừng bạn đến với hệ thống quản lý căng tin.</p>
          </div>

          <button onclick="go('menu')" class="dashboard-primary-btn">
            🍜 Xem thực đơn hôm nay
          </button>
        </div>

        <div class="dashboard-stat-grid">

          <div class="dashboard-stat-card">
            <div class="dashboard-stat-icon">🍜</div>
            <div>
              <span>Thực đơn hôm nay</span>
              <strong>${publishedMenus.length}</strong>
              <small>Thực đơn đang phục vụ</small>
            </div>
          </div>

          <div class="dashboard-stat-card">
            <div class="dashboard-stat-icon">🛒</div>
            <div>
              <span>Giỏ hàng</span>
              <strong>${cartCount}</strong>
              <small>Món đang chờ đặt</small>
            </div>
          </div>

          <div class="dashboard-stat-card">
            <div class="dashboard-stat-icon">📋</div>
            <div>
              <span>Đơn đang xử lý</span>
              <strong>${pendingOrders.length}</strong>
              <small>Đơn hàng của bạn</small>
            </div>
          </div>

          <div class="dashboard-stat-card">
            <div class="dashboard-stat-icon">✓</div>
            <div>
              <span>Đã hoàn thành</span>
              <strong>${completedOrders.length}</strong>
              <small>Đơn đã nhận</small>
            </div>
          </div>

        </div>

        <div class="dashboard-section-grid">

          <div class="dashboard-panel">

            <div class="dashboard-panel-header">
              <div>
                <h3>🍜 Thực đơn hôm nay</h3>
                <p>Các món đang được phục vụ</p>
              </div>

              <button
                class="dashboard-link-btn"
                onclick="go('menu')">
                Xem tất cả →
              </button>
            </div>

            ${
              publishedMenus.length
              ? `
                <div class="dashboard-menu-list">
                  ${publishedMenus.slice(0, 3).map(m => `
                    <div class="dashboard-menu-item">

                      <div class="dashboard-menu-icon">
                        🍱
                      </div>

                      <div>
                        <strong>${esc(m.name || "Thực đơn")}</strong>
                        <span>
                          ${esc(m.menu_type || "Thực đơn hôm nay")}
                        </span>
                      </div>

                      <span class="dashboard-status success">
                        Đang phục vụ
                      </span>

                    </div>
                  `).join("")}
                </div>
              `
              : `
                <div class="dashboard-empty">
                  🍽️
                  <p>Hiện chưa có thực đơn được công bố.</p>
                </div>
              `
            }

          </div>


          <div class="dashboard-panel">

            <div class="dashboard-panel-header">
              <div>
                <h3>📋 Đơn hàng của tôi</h3>
                <p>Theo dõi tình trạng đơn hàng</p>
              </div>

              <button
                class="dashboard-link-btn"
                onclick="go('orders')">
                Xem đơn →
              </button>
            </div>

            ${
              pendingOrders.length
              ? `
                <div class="dashboard-order-list">
                  ${pendingOrders.slice(0, 4).map(o => `
                    <div class="dashboard-order-item">

                      <div>
                        <strong>${esc(o.order_code || "")}</strong>
                        <span>${fmt(o.created_at)}</span>
                      </div>

                      <div class="dashboard-order-right">
                        <strong>${money(o.total_amount)}</strong>
                        <span class="dashboard-status">
                          ${statusText(o.status)}
                        </span>
                      </div>

                    </div>
                  `).join("")}
                </div>
              `
              : `
                <div class="dashboard-empty">
                  📋
                  <p>Bạn chưa có đơn hàng đang xử lý.</p>
                  <button onclick="go('menu')">
                    Đặt món ngay
                  </button>
                </div>
              `
            }

          </div>

        </div>

      `;

      return;
    }


    // =====================================================
    // 2. NHÂN VIÊN
    // =====================================================
    if (role === "STAFF") {

      const [orders, goods, foods] = await Promise.all([
        api("/orders"),
        api("/goods?q="),
        api("/foods")
      ]);

      const pending = (orders || []).filter(
        o => o.status === "PENDING"
      );

      const preparing = (orders || []).filter(
        o => o.status === "PREPARING"
      );

      const ready = (orders || []).filter(
        o => o.status === "READY"
      );

      const lowStock = (goods || []).filter(g => {
        const available =
          Number(g.quantity || 0) -
          Number(g.reservedQuantity || 0);

        return available <= Number(g.minQuantity || 0);
      });

      const availableFoods = (foods || []).filter(
        f => f.available !== false
      );

      document.getElementById("page").innerHTML = `

        <div class="dashboard-welcome">
          <div>
            <div class="dashboard-subtitle">Tổng quan nhân viên</div>

            <h2>
              Xin chào, ${esc(state.user.fullName || "Nhân viên")} 👋
            </h2>

            <p>
              Theo dõi đơn hàng, món ăn và tình trạng tồn kho.
            </p>
          </div>

          <button
            onclick="go('orders')"
            class="dashboard-primary-btn">
            🧾 Xử lý đơn hàng
          </button>
        </div>


        <div class="dashboard-stat-grid">

          <div class="dashboard-stat-card warning-card">
            <div class="dashboard-stat-icon">⏳</div>
            <div>
              <span>Chờ xác nhận</span>
              <strong>${pending.length}</strong>
              <small>Đơn cần xử lý</small>
            </div>
          </div>

          <div class="dashboard-stat-card preparing-card">
            <div class="dashboard-stat-icon">🍳</div>
            <div>
              <span>Đang chuẩn bị</span>
              <strong>${preparing.length}</strong>
              <small>Đơn đang thực hiện</small>
            </div>
          </div>

          <div class="dashboard-stat-card ready-card">
            <div class="dashboard-stat-icon">✓</div>
            <div>
              <span>Sẵn sàng</span>
              <strong>${ready.length}</strong>
              <small>Chờ khách nhận</small>
            </div>
          </div>

          <div class="dashboard-stat-card">
            <div class="dashboard-stat-icon">🍱</div>
            <div>
              <span>Món đang bán</span>
              <strong>${availableFoods.length}</strong>
              <small>Món có thể phục vụ</small>
            </div>
          </div>

        </div>


        <div class="dashboard-section-grid">

          <div class="dashboard-panel">

            <div class="dashboard-panel-header">

              <div>
                <h3>🧾 Đơn hàng cần xử lý</h3>
                <p>Các đơn hàng mới nhất</p>
              </div>

              <button
                class="dashboard-link-btn"
                onclick="go('orders')">
                Xem tất cả →
              </button>

            </div>

            ${
              pending.length
              ? `
                <div class="dashboard-order-list">

                  ${pending.slice(0, 5).map(o => `
                    <div class="dashboard-order-item">

                      <div>
                        <strong>${esc(o.order_code || "")}</strong>

                        <span>
                          ${esc(o.customer_name || "Khách hàng")}
                        </span>
                      </div>

                      <div class="dashboard-order-right">

                        <strong>
                          ${money(o.total_amount)}
                        </strong>

                        <button
                          onclick="orderActions(${o.id}, 'CONFIRMED')">
                          Xác nhận
                        </button>

                      </div>

                    </div>
                  `).join("")}

                </div>
              `
              : `
                <div class="dashboard-empty">
                  ✓
                  <p>Hiện không có đơn hàng chờ xác nhận.</p>
                </div>
              `
            }

          </div>


          <div class="dashboard-panel">

            <div class="dashboard-panel-header">

              <div>
                <h3>📦 Tình trạng tồn kho</h3>
                <p>Các hàng hóa cần chú ý</p>
              </div>

              <button
                class="dashboard-link-btn"
                onclick="go('inventory')">
                Xem kho →
              </button>

            </div>

            ${
              lowStock.length
              ? `
                <div class="dashboard-stock-list">

                  ${lowStock.slice(0, 5).map(g => {

                    const available =
                      Number(g.quantity || 0) -
                      Number(g.reservedQuantity || 0);

                    return `
                      <div class="dashboard-stock-item">

                        <div>
                          <strong>${esc(g.name)}</strong>

                          <span>
                            Tối thiểu: ${g.minQuantity} ${esc(g.unit || "")}
                          </span>
                        </div>

                        <span class="dashboard-stock-warning">
                          ${available.toFixed(2)}
                          ${esc(g.unit || "")}
                        </span>

                      </div>
                    `;

                  }).join("")}

                </div>
              `
              : `
                <div class="dashboard-empty">
                  ✓
                  <p>Tồn kho hiện đang ổn định.</p>
                </div>
              `
            }

          </div>

        </div>


        <div class="dashboard-panel dashboard-quick-panel">

          <div class="dashboard-panel-header">

            <div>
              <h3>⚡ Thao tác nhanh</h3>
              <p>Các chức năng thường sử dụng</p>
            </div>

          </div>

          <div class="dashboard-quick-actions">

            <button onclick="go('orders')">
              🧾
              <span>Xử lý đơn hàng</span>
            </button>

            <button onclick="go('foods')">
              🍱
              <span>Quản lý món ăn</span>
            </button>

            <button onclick="go('menus')">
              📋
              <span>Thực đơn</span>
            </button>

            <button onclick="go('inventory')">
              📦
              <span>Kiểm tra tồn kho</span>
            </button>

            <button onclick="go('payments')">
              💳
              <span>Thanh toán</span>
            </button>

          </div>

        </div>

      `;

      return;
    }


    // =====================================================
    // 3. QUẢN LÝ
    // =====================================================
    if (role === "MANAGER") {

      const [
        revenue,
        orders,
        foods,
        goods,
        menus
      ] = await Promise.all([
        api("/reports/revenue"),
        api("/orders"),
        api("/foods"),
        api("/goods?q="),
        api("/menus")
      ]);

      const totalRevenue =
        Number(revenue?.revenue || 0);

      const paidOrders =
        (orders || []).filter(
          o => o.payment_status === "PAID"
        );

      const lowStock =
        (goods || []).filter(g => {

          const available =
            Number(g.quantity || 0) -
            Number(g.reservedQuantity || 0);

          return available <= Number(g.minQuantity || 0);

        });

      const publishedMenus =
        (menus || []).filter(
          m => m.status === "PUBLISHED"
        );

      const availableFoods =
        (foods || []).filter(
          f => f.available !== false
        );

      document.getElementById("page").innerHTML = `

        <div class="dashboard-welcome">

          <div>

            <div class="dashboard-subtitle">
              Tổng quan quản lý
            </div>

            <h2>
              Xin chào, ${esc(state.user.fullName || "Quản lý")} 👋
            </h2>

            <p>
              Theo dõi hoạt động kinh doanh và tình hình vận hành căng tin.
            </p>

          </div>

          <button
            onclick="go('reports')"
            class="dashboard-primary-btn">
            📊 Xem báo cáo
          </button>

        </div>


        <div class="dashboard-stat-grid">

          <div class="dashboard-stat-card revenue-card">

            <div class="dashboard-stat-icon">💰</div>

            <div>
              <span>Doanh thu</span>

              <strong>
                ${money(totalRevenue)}
              </strong>

              <small>
                Doanh thu đã thanh toán
              </small>
            </div>

          </div>


          <div class="dashboard-stat-card">

            <div class="dashboard-stat-icon">🧾</div>

            <div>
              <span>Tổng đơn hàng</span>

              <strong>
                ${(orders || []).length}
              </strong>

              <small>
                Tổng số đơn trong hệ thống
              </small>
            </div>

          </div>


          <div class="dashboard-stat-card">

            <div class="dashboard-stat-icon">🍱</div>

            <div>
              <span>Món đang bán</span>

              <strong>
                ${availableFoods.length}
              </strong>

              <small>
                Món ăn khả dụng
              </small>
            </div>

          </div>


          <div class="dashboard-stat-card warning-card">

            <div class="dashboard-stat-icon">⚠️</div>

            <div>
              <span>Cảnh báo tồn kho</span>

              <strong>
                ${lowStock.length}
              </strong>

              <small>
                Hàng hóa sắp hết
              </small>
            </div>

          </div>

        </div>


        <div class="dashboard-section-grid">


          <div class="dashboard-panel">

            <div class="dashboard-panel-header">

              <div>
                <h3>📊 Tình hình kinh doanh</h3>
                <p>Tổng quan hoạt động hiện tại</p>
              </div>

              <button
                class="dashboard-link-btn"
                onclick="go('reports')">
                Xem báo cáo →
              </button>

            </div>


            <div class="dashboard-manager-list">

              <div class="dashboard-manager-row">

                <span>💰 Doanh thu</span>

                <strong>
                  ${money(totalRevenue)}
                </strong>

              </div>


              <div class="dashboard-manager-row">

                <span>🧾 Đơn đã thanh toán</span>

                <strong>
                  ${paidOrders.length}
                </strong>

              </div>


              <div class="dashboard-manager-row">

                <span>🍱 Món đang bán</span>

                <strong>
                  ${availableFoods.length}
                </strong>

              </div>


              <div class="dashboard-manager-row">

                <span>📋 Thực đơn đang công bố</span>

                <strong>
                  ${publishedMenus.length}
                </strong>

              </div>

            </div>

          </div>


          <div class="dashboard-panel">

            <div class="dashboard-panel-header">

              <div>
                <h3>📦 Cảnh báo tồn kho</h3>
                <p>Hàng hóa cần được bổ sung</p>
              </div>

              <button
                class="dashboard-link-btn"
                onclick="go('inventory')">
                Xem kho →
              </button>

            </div>


            ${
              lowStock.length
              ? `
                <div class="dashboard-stock-list">

                  ${lowStock.slice(0, 5).map(g => {

                    const available =
                      Number(g.quantity || 0) -
                      Number(g.reservedQuantity || 0);

                    return `
                      <div class="dashboard-stock-item">

                        <div>
                          <strong>
                            ${esc(g.name)}
                          </strong>

                          <span>
                            Tối thiểu:
                            ${g.minQuantity}
                            ${esc(g.unit || "")}
                          </span>
                        </div>

                        <span class="dashboard-stock-warning">
                          ${available.toFixed(2)}
                          ${esc(g.unit || "")}
                        </span>

                      </div>
                    `;

                  }).join("")}

                </div>
              `
              : `
                <div class="dashboard-empty">
                  ✓
                  <p>Tồn kho đang ổn định.</p>
                </div>
              `
            }

          </div>


        </div>


        <div class="dashboard-panel dashboard-quick-panel">

          <div class="dashboard-panel-header">

            <div>
              <h3>⚡ Quản lý nhanh</h3>
              <p>Truy cập các chức năng quản lý</p>
            </div>

          </div>


          <div class="dashboard-quick-actions">

            <button onclick="go('foods')">
              🍱
              <span>Quản lý món ăn</span>
            </button>

            <button onclick="go('menus')">
              📋
              <span>Quản lý thực đơn</span>
            </button>

            <button onclick="go('orders')">
              🧾
              <span>Quản lý đơn hàng</span>
            </button>

            <button onclick="go('inventory')">
              📦
              <span>Quản lý tồn kho</span>
            </button>

            <button onclick="go('users')">
              👥
              <span>Tài khoản nhân viên</span>
            </button>

            <button onclick="go('reports')">
              📊
              <span>Thống kê & báo cáo</span>
            </button>

          </div>

        </div>

      `;

      return;
    }

  } catch (e) {

    console.error(e);

    document.getElementById("page").innerHTML = `
      <div class="dashboard-error">
        <div>⚠️</div>
        <h3>Không thể tải tổng quan</h3>
        <p>${esc(e.message || "Đã xảy ra lỗi")}</p>
        <button onclick="dashboard()">
          Thử lại
        </button>
      </div>
    `;
  }
}
async function foods(){
  try{
    const list = await api("/foods");

    const enriched = [];
    for(const f of list){
      const d = await api("/foods/" + f.id);
      enriched.push(d);
    }

    const manager = state.user.role !== "CUSTOMER";

    document.getElementById("page").innerHTML = `
      ${
        manager
        ? `
          <div class="toolbar">
            <button onclick="foodForm()">＋ Thêm món ăn</button>
          </div>
        `
        : ""
      }

      <div class="food-grid">
        ${
          enriched.map(f => `
            <div class="food-card">

              <div class="food-img">
                ${
                  f.imageUrl || f.image_url
                  ? `
                    <img
                      src="${esc(f.imageUrl || f.image_url)}"
                      alt="${esc(f.name)}"
                      onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                    >

                    <div class="food-img-fallback" style="display:none;">
                      🍱
                    </div>
                  `
                  : `
                    <div class="food-img-fallback">
                      🍱
                    </div>
                  `
                }
              </div>

              <div class="food-body">

                <h3>${esc(f.name)}</h3>

                <p>${esc(f.description || "")}</p>

                <div class="muted2">
                  ${esc(f.category || "")}
                </div>

                <div class="price">
                  ${money(f.price)}
                </div>

                <div>
                  ${
                    f.available
                    ? `<span class="success">✓ Có thể phục vụ</span>`
                    : `<span class="alert">✕ Không khả dụng</span>`
                  }
                </div>

                <div class="topping-list">
                  ${
                    (f.toppings || []).map(t => `
                      <span class="tag">
                        ${esc(t.name)}
                        ${money(t.price)}
                        ${t.available ? "✓" : "✕"}
                      </span>
                    `).join("")
                  }
                </div>

                <div class="actions">

                  ${
  state.user.role === "CUSTOMER"
  ? `
    <button
      onclick='viewFood(${JSON.stringify(f).replaceAll("'","&#039;")})'>
      Xem chi tiết
    </button>
  `
  : `
    <button
      onclick='foodForm(${JSON.stringify(f).replaceAll("'","&#039;")})'>
      Sửa
    </button>

    <button
      class="danger"
      onclick="stopFood(${f.id})">
      Ngừng bán
    </button>
  `
}

                </div>

              </div>
            </div>
          `).join("")
        }
      </div>
    `;

  }catch(e){
    document.getElementById("page").innerHTML = `
      <div class="alert">
        ${esc(e.message)}
      </div>
    `;
  }
}
function viewFood(f) {
  document.getElementById("page").innerHTML = `
    <div class="card form-card">
      <h3>${esc(f.name)}</h3>

      <p>${esc(f.description || "Chưa có mô tả")}</p>

      <h3>${money(f.price)}</h3>

      <p>Danh mục: ${esc(f.category || "")}</p>

      <h4>Topping có thể chọn</h4>

      <div class="topping-list">
        ${(f.toppings || []).map(t => `
          <span class="tag">
            ${esc(t.name)} - ${money(t.price)}
            ${t.available ? "✓" : "✕"}
          </span>
        `).join("") || "Không có topping"}
      </div>

      <button class="secondary" onclick="foods()">
        Quay lại danh sách món ăn
      </button>
    </div>
  `;
}
function openFood(f){const available=(f.toppings||[]).filter(t=>t.available);document.getElementById("page").innerHTML=`<div class="card form-card"><h3>${esc(f.name)}</h3><p>${esc(f.description||"")}</p><h3>${money(f.price)}</h3><label>Chọn topping</label><div>${available.map(t=>`<label class="check"><input type="checkbox" class="open-top" value="${t.id}"> ${esc(t.name)} (+${money(t.price)})</label>`).join("")||"Không có topping khả dụng"}</div><input id="foodQty" type="number" min="1" value="1"><input id="foodNote" placeholder="Ghi chú"><button onclick='addCart(${f.id},${JSON.stringify(f.name)},${f.price})'>Thêm vào giỏ</button></div>`}
function addCart(id,name,price){const toppings=[...document.querySelectorAll(".open-top:checked")].map(x=>Number(x.value));const note=document.getElementById("foodNote")?.value||"";const qty=Number(document.getElementById("foodQty")?.value||1);const key=id+"-"+toppings.sort().join(",");const old=state.cart.find(x=>x.key===key);if(old)old.quantity+=qty;else state.cart.push({key,foodId:id,name,price,quantity:qty,toppingIds:toppings,note});alert("Đã thêm vào giỏ hàng");go("cart")}


async function addToCart(foodId) {
  try {
    // Chỉ cho phép chọn món nằm trong thực đơn đã tải
    const food = (window.customerMenuFoods || []).find(
      f => Number(f.food_id || f.id) === Number(foodId)
    );

    if (!food) {
      alert("Món ăn không thuộc thực đơn hiện tại!");
      return;
    }

    if (food.available === false) {
      alert("Món ăn hiện không khả dụng!");
      return;
    }

    // Lấy thông tin chi tiết món ăn, bao gồm topping
    const detail = await api("/foods/" + foodId);

    // Kết hợp thông tin món trong thực đơn và thông tin chi tiết
    const selectedFood = {
      ...food,
      ...detail,
      id: Number(foodId),
      name: detail.name || food.food_name || food.name,
      price: food.price ?? detail.price,
      toppings: detail.toppings || food.toppings || []
    };

    // Mở giao diện chọn topping, số lượng và ghi chú
    openFood(selectedFood);

  } catch (e) {
    alert(e.message);
  }
}

function cart(){const total=state.cart.reduce((s,x)=>s+x.price*x.quantity,0);document.getElementById("page").innerHTML=`<div class="card"><h3>Giỏ hàng</h3>${state.cart.length?`${state.cart.map((x,i)=>`<div class="cart-row"><div><b>${esc(x.name)}</b><div class="muted2">Topping: ${x.toppingIds.length?x.toppingIds.join(", "):"Không"}</div><div>${money(x.price)} × <input type="number" min="1" value="${x.quantity}" onchange="state.cart[${i}].quantity=+this.value;cart()"></div></div><button class="danger" onclick="state.cart.splice(${i},1);cart()">Xóa</button></div>`).join("")}<hr><h3>Tổng: ${money(total)}</h3><label>Phương thức thanh toán</label><select id="checkoutMethod"><option value="CASH">Tiền mặt</option><option value="QR">QR</option><option value="BANK_TRANSFER">Chuyển khoản</option></select><input id="pickupInfo" placeholder="Thông tin nhận món"><input id="orderNote" placeholder="Ghi chú đơn hàng"><button onclick="checkout()">Xác nhận đặt món</button>`:`<p>Giỏ hàng đang trống.</p>`}</div>`}
async function checkout(){try{if(!state.cart.length)return;const r=await api("/orders",{method:"POST",body:JSON.stringify({customerId:state.user.id,note:orderNote.value,pickupInfo:pickupInfo.value,paymentMethod:checkoutMethod.value,items:state.cart.map(x=>({foodId:x.foodId,quantity:x.quantity,toppingIds:x.toppingIds,note:x.note}))})});state.cart=[];alert("Đặt món thành công: "+r.orderCode);go("orders")}catch(e){alert(e.message)}}
//async function menu(){const d=await api("/menus/today");const items=d.items||[];document.getElementById("page").innerHTML=`<div class="card"><h3>${d.menu?esc(d.menu.name):"Chưa có thực đơn hiệu lực"}</h3><p>${d.menu?esc(d.menu.menu_type||""):""}</p></div><div class="food-grid">${items.map(f=>`<div class="food-card"><div class="food-body"><h3>${esc(f.food_name)}</h3><p>${esc(f.description||"")}</p><div class="price">${money(f.price)}</div><p>${f.available?"✓ Khả dụng":"✕ Không khả dụng"}</p><div class="topping-list">${(f.toppings||[]).map(t=>`<span class="tag">${esc(t.name)} ${t.available?"✓":"✕ Hết"}</span>`).join("")}</div><button ${f.available?"":"disabled"} onclick='addCart(${f.food_id},${JSON.stringify(f.food_name)},${f.price})'>Thêm nhanh</button></div></div>`).join("")}</div>`}
async function menu(){
  try{
    const menus = await api("/menus");

    if(!menus || !menus.length){
      document.getElementById("page").innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h3>Chưa có thực đơn</h3>
          <p>Hiện tại chưa có thực đơn nào được công bố.</p>
        </div>
      `;
      return;
    }

    // Chỉ lấy thực đơn đang được công bố
    const publishedMenus = menus.filter(m => m.status === "PUBLISHED");

    if(!publishedMenus.length){
      document.getElementById("page").innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h3>Chưa có thực đơn</h3>
          <p>Hiện tại chưa có thực đơn đang được công bố.</p>
        </div>
      `;
      return;
    }

    let html = "";
    window.customerMenuFoods = [];

    for(const m of publishedMenus){
      // Lấy chi tiết thực đơn, trong đó có foods
      const detail = await api("/menus/" + m.id);
      const foods = detail.foods || [];

// Lưu danh sách món ăn để addToCart tìm kiếm
window.customerMenuFoods = [
    ...(window.customerMenuFoods || []),
    ...foods
];

      html += `
        <div class="customer-menu-card">
          <div class="customer-menu-header">
            <div>
              <h2>${esc(m.name || "Thực đơn")}</h2>
              <span class="menu-type">${esc(m.menu_type || "")}</span>
            </div>
            <span class="menu-status">Đang phục vụ</span>
          </div>

          <div class="customer-food-grid">
            ${
              foods.length
                ? foods.map(food => customerFoodCard(food)).join("")
                : `
                  <div class="empty-menu-food">
                    Chưa có món ăn trong thực đơn này.
                  </div>
                `
            }
          </div>
        </div>
      `;
    }

    document.getElementById("page").innerHTML = html;

  }catch(e){
    console.error(e);

    document.getElementById("page").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Không thể tải thực đơn</h3>
        <p>${esc(e.message || "Đã xảy ra lỗi")}</p>
      </div>
    `;
  }
}


function customerFoodCard(food) {
  // Lấy đúng trường ảnh từ API
  const image = food.image_url || food.image || "";

  let imageUrl = "";

  if (image) {
    if (
      image.startsWith("data:image/") ||
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      // Base64 hoặc URL đầy đủ: giữ nguyên
      imageUrl = image;
    } else if (image.startsWith("/")) {
      imageUrl = "http://localhost:8080" + image;
    } else {
      imageUrl = "http://localhost:8080/" + image;
    }
  }

  const foodName = food.food_name || food.name || "Món ăn";
  const foodId = food.food_id || food.id;

  return `
    <div class="customer-food-card">

      <div class="customer-food-image">
        ${
          imageUrl
            ? `
              <img
                src="${esc(imageUrl)}"
                alt="${esc(foodName)}"
                onerror="
                  this.style.display='none';
                  this.nextElementSibling.style.display='flex';
                "
              >
              <div class="food-image-placeholder" style="display:none">
                🍽️
              </div>
            `
            : `
              <div class="food-image-placeholder">
                🍽️
              </div>
            `
        }
      </div>

      <div class="customer-food-info">
        <h3>${esc(foodName)}</h3>

        <p class="customer-food-description">
          ${esc(food.description || "Chưa có mô tả")}
        </p>

        <div class="customer-food-bottom">
          <span class="customer-food-price">
            ${Number(food.price || 0).toLocaleString("vi-VN")} ₫
          </span>

          <button
  class="customer-add-btn"
  ${food.available === false ? "disabled" : ""}
  onclick="addToCart(${Number(foodId)})"
>
  ＋ Đặt món
</button>
        </div>
      </div>

    </div>
  `;
}


let selectedFoodImage = "";

async function foodForm(f = {}) {
  const goods = await api("/goods?q=");
  const tops = await api("/toppings");

  const ing = f.ingredients || [];
  const chosen = (f.toppings || []).map(t => t.id);

  // Nếu sửa món và món đã có ảnh thì giữ lại ảnh cũ
  selectedFoodImage = f.imageUrl || f.image_url || "";

  document.getElementById("page").innerHTML = `
    <div class="food-form-card">

      <div class="food-form-header">
        <div class="food-form-icon">🍱</div>
        <div>
          <h3>${f.id ? "Cập nhật món ăn" : "Thêm món ăn"}</h3>
          <p>
            ${f.id
              ? "Cập nhật thông tin và hình ảnh món ăn"
              : "Thêm món ăn mới vào hệ thống"}
          </p>
        </div>
      </div>

      <div class="food-form-body">

        <!-- THÔNG TIN MÓN -->
        <div class="food-form-section">
          <h4>Thông tin món ăn</h4>

          <div class="food-form-grid">

            <div class="food-field">
              <label>Tên món <span>*</span></label>
              <input
                id="fName"
                type="text"
                placeholder="Nhập tên món ăn"
                value="${esc(f.name || "")}">
            </div>

            <div class="food-field">
              <label>Danh mục <span>*</span></label>
              <input
                id="fCategory"
                type="text"
                placeholder="Ví dụ: Cơm, Mì, Bún..."
                value="${esc(f.category || "")}">
            </div>

            <div class="food-field">
              <label>Giá bán <span>*</span></label>
              <input
                id="fPrice"
                type="number"
                min="0"
                step="100"
                placeholder="Nhập giá bán"
                value="${f.price ?? 0}">
            </div>

            <div class="food-field">
              <label>Trạng thái</label>
              <select id="fStatus">
                <option value="AVAILABLE">Đang bán</option>
                <option value="STOPPED">Ngừng bán</option>
              </select>
            </div>

            <div class="food-field food-field-full">
              <label>Mô tả</label>
              <textarea
                id="fDesc"
                placeholder="Nhập mô tả món ăn..."
              >${esc(f.description || "")}</textarea>
            </div>

          </div>
        </div>

        <!-- HÌNH ẢNH -->
        <div class="food-form-section">

          <h4>Hình ảnh món ăn</h4>

          <div class="food-image-upload">

            <div class="food-image-preview" id="foodImagePreview">
              ${
                selectedFoodImage
                ? `
                  <img
                    src="${esc(selectedFoodImage)}"
                    alt="Ảnh món ăn"
                    onerror="foodImagePreviewFallback()">
                `
                : `
                  <div class="food-image-placeholder">
                    <div>🍱</div>
                    <span>Chưa có ảnh</span>
                  </div>
                `
              }
            </div>

            <div class="food-image-control">

              <label class="food-upload-btn">
                📷 Chọn ảnh
                <input
                  id="fImageFile"
                  type="file"
                  accept="image/*"
                  onchange="handleFoodImage(this)"
                  hidden>
              </label>

              <button
                type="button"
                class="food-remove-image"
                onclick="removeFoodImage()">
                🗑 Xóa ảnh
              </button>

              <p class="food-image-help">
                Chọn ảnh món ăn từ máy tính.
              </p>

              <p class="food-image-help">
                Định dạng: JPG, JPEG, PNG, WEBP
              </p>

            </div>

          </div>

        </div>

        <!-- NGUYÊN LIỆU -->
        <div class="food-form-section">

          <h4>Nguyên liệu / định lượng</h4>

          <div id="ingredientsForm">
            ${ing.map(x => ingredientRow(goods, x)).join("")}
          </div>

          <button
            type="button"
            class="food-secondary-btn"
            onclick="addIngredientRow()">
            ＋ Thêm nguyên liệu
          </button>

        </div>

        <!-- TOPPING -->
        <div class="food-form-section">

          <h4>Topping</h4>

          <div class="food-topping-grid">

            ${
              tops.length
              ? tops.map(t => `
                <label class="food-check">
                  <input
                    type="checkbox"
                    class="food-top"
                    value="${t.id}"
                    ${chosen.includes(t.id) ? "checked" : ""}>
                  <span>
                    ${esc(t.name)}
                    <small>+${money(t.price)}</small>
                  </span>
                </label>
              `).join("")
              : `<p class="muted2">Chưa có topping.</p>`
            }

          </div>

        </div>

      </div>

      <!-- BUTTON -->
      <div class="food-form-actions">

        <button
          type="button"
          class="food-save-btn"
          onclick="saveFood(${f.id || 0})">
          ${f.id ? "💾 Lưu thay đổi" : "＋ Thêm món ăn"}
        </button>

        <button
          type="button"
          class="food-cancel-btn"
          onclick="foods()">
          Hủy
        </button>

      </div>

    </div>
  `;

  document.getElementById("fStatus").value =
    f.status || "AVAILABLE";
}

function handleFoodImage(input) {
  const file = input.files && input.files[0];

  if (!file) return;

  // Kiểm tra loại file
  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn file hình ảnh.");
    input.value = "";
    return;
  }

  // Giới hạn 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert("Ảnh không được vượt quá 5MB.");
    input.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {

    // Lưu ảnh dạng Base64
    selectedFoodImage = e.target.result;

    // Hiển thị preview
    const preview = document.getElementById("foodImagePreview");

    preview.innerHTML = `
      <img
        src="${selectedFoodImage}"
        alt="Ảnh món ăn">
    `;
  };

  reader.readAsDataURL(file);
}

function removeFoodImage() {
  selectedFoodImage = "";

  const fileInput = document.getElementById("fImageFile");

  if (fileInput) {
    fileInput.value = "";
  }

  const preview = document.getElementById("foodImagePreview");

  if (preview) {
    preview.innerHTML = `
      <div class="food-image-placeholder">
        <div>🍱</div>
        <span>Chưa có ảnh</span>
      </div>
    `;
  }
}
function ingredientRow(goods,x={}){return `<div class="ing-row"><select class="ing-good">${goods.map(g=>`<option value="${g.id}" ${Number(x.good_id??x.goodId)===g.id?"selected":""}>${esc(g.code)} - ${esc(g.name)} (${g.unit})</option>`).join("")}</select><input class="ing-qty" type="number" min="0.001" step="0.001" value="${x.quantity??0.001}"><button class="danger" onclick="this.parentElement.remove()">X</button></div>`}
function addIngredientRow(){api("/goods?q=").then(goods=>document.getElementById("ingredientsForm").insertAdjacentHTML("beforeend",ingredientRow(goods,{})))}
async function saveFood(id) {
  try {

    const name = document.getElementById("fName").value.trim();
    const description = document.getElementById("fDesc").value.trim();
    const category = document.getElementById("fCategory").value.trim();
    const price = Number(document.getElementById("fPrice").value);
    const status = document.getElementById("fStatus").value;

    if (!name) {
      throw new Error("Vui lòng nhập tên món ăn");
    }

    if (!category) {
      throw new Error("Vui lòng nhập danh mục");
    }

    if (!price || price <= 0) {
      throw new Error("Giá món ăn phải lớn hơn 0");
    }

    const ingredients = [
      ...document.querySelectorAll(".ing-row")
    ].map(row => ({
      goodId: Number(
        row.querySelector(".ing-good").value
      ),
      quantity: Number(
        row.querySelector(".ing-qty").value
      )
    }));

    const toppings = [
      ...document.querySelectorAll(".food-top:checked")
    ].map(x => Number(x.value));

    const body = {
      name,
      description,
      category,
      price,
      status,

      // Ảnh được chọn từ máy
      imageUrl: selectedFoodImage,

      ingredients,
      toppings
    };

    await api(
      id ? "/foods/" + id : "/foods",
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(body)
      }
    );

    selectedFoodImage = "";

    alert(
      id
        ? "Cập nhật món ăn thành công"
        : "Thêm món ăn thành công"
    );

    foods();

  } catch (e) {
    alert(e.message);
  }
}
async function stopFood(id){if(confirm("Ngừng bán món này?")){try{await api("/foods/"+id,{method:"DELETE"});foods()}catch(e){alert(e.message)}}}

async function toppings(){const list=await api("/toppings");document.getElementById("page").innerHTML=`<div class="toolbar"><button onclick="toppingForm()">＋ Thêm topping</button></div><div class="table-wrap"><table class="table"><tr><th>Tên</th><th>Giá</th><th>Trạng thái</th><th>Khả dụng</th><th></th></tr>${list.map(t=>`<tr><td>${esc(t.name)}</td><td>${money(t.price)}</td><td>${statusText(t.status)}</td><td>${t.available?"✓":"✕"}</td><td><button onclick='toppingForm(${JSON.stringify(t)})'>Sửa</button><button class="danger" onclick="stopTopping(${t.id})">Ngừng bán</button></td></tr>`).join("")}</table></div>`}
async function toppingForm(t={}){const gs=await api("/goods?q=");const detail=t.id?await api("/toppings").then(a=>a.find(x=>x.id===t.id)):t;document.getElementById("page").innerHTML=`<div class="card form-card"><h3>${t.id?"Cập nhật topping":"Thêm topping"}</h3><input id="tName" placeholder="Tên topping" value="${esc(t.name||"")}"><input id="tPrice" type="number" min="0" value="${t.price??0}"><select id="tStatus"><option value="AVAILABLE">Đang bán</option><option value="STOPPED">Ngừng bán</option></select><h4>Nguyên liệu</h4><div id="topIng">${(detail?.ingredients||[]).map(x=>ingredientRow(gs,x)).join("")}</div><button onclick="api('/goods?q=').then(gs=>topIng.insertAdjacentHTML('beforeend',ingredientRow(gs,{})))">＋ Nguyên liệu</button><div><button onclick="saveTopping(${t.id||0})">Lưu</button> <button class="secondary" onclick="toppings()">Quay lại</button></div></div>`}
async function saveTopping(id){try{const ingredients=[...document.querySelectorAll("#topIng .ing-row")].map(r=>({goodId:Number(r.querySelector(".ing-good").value),quantity:Number(r.querySelector(".ing-qty").value)}));await api(id?"/toppings/"+id:"/toppings",{method:id?"PUT":"POST",body:JSON.stringify({name:tName.value,price:Number(tPrice.value),status:tStatus.value,ingredients})});toppings()}catch(e){alert(e.message)}}
async function stopTopping(id){if(confirm("Ngừng bán topping?")){try{await api("/toppings/"+id,{method:"DELETE"});toppings()}catch(e){alert(e.message)}}}

async function menus(){const [ms,fs]=await Promise.all([api("/menus"),api("/foods")]);document.getElementById("page").innerHTML=`<div class="toolbar"><button onclick='menuForm()'>＋ Lập thực đơn</button></div><div class="table-wrap"><table class="table"><tr><th>Tên</th><th>Loại</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th>Món</th><th></th></tr>${ms.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.menu_type)}</td><td>${fmt(m.start_time)}</td><td>${fmt(m.end_time)}</td><td>${statusText(m.status)}</td><td>${m.food_count}</td><td><button onclick='menuForm(${JSON.stringify(m)})'>Sửa</button><button class="danger" onclick="closeMenu(${m.id})">Đóng</button></td></tr>`).join("")}</table></div>`}
async function menuForm(m={}){const fs=await api("/foods");if(m.id)m=await api("/menus/"+m.id);const chosen=m.foodIds||[];document.getElementById("page").innerHTML=`<div class="card form-card"><h3>${m.id?"Cập nhật thực đơn":"Lập thực đơn"}</h3><input id="mName" placeholder="Tên thực đơn" value="${esc(m.name||"")}"><input id="mType" placeholder="Loại" value="${esc(m.menu_type||"Bữa trưa")}"><label>Thời gian bắt đầu</label><input id="mStart" type="datetime-local" value="${toInputDate(m.start_time)}"><label>Thời gian kết thúc</label><input id="mEnd" type="datetime-local" value="${toInputDate(m.end_time)}"><select id="mStatus"><option value="DRAFT">Nháp</option><option value="PUBLISHED">Công bố</option><option value="CLOSED">Đóng</option></select><h4>Chọn món</h4><div class="check-grid">${fs.map(f=>`<label class="check"><input type="checkbox" class="menu-food" value="${f.id}" ${chosen.includes(f.id)?"checked":""}> ${esc(f.name)} - ${money(f.price)}</label>`).join("")}</div><button onclick="saveMenu(${m.id||0})">Lưu</button> <button class="secondary" onclick="menus()">Quay lại</button></div>`;mStatus.value=m.status||"DRAFT"}
function toInputDate(x){if(!x)return "";return String(x).replace(" ","T").slice(0,16)}
async function saveMenu(id){try{const foodIds=[...document.querySelectorAll(".menu-food:checked")].map(x=>Number(x.value));if(!foodIds.length)throw new Error("Phải chọn ít nhất một món");await api(id?"/menus/"+id:"/menus",{method:id?"PUT":"POST",body:JSON.stringify({name:mName.value,menuType:mType.value,startTime:mStart.value,endTime:mEnd.value,status:mStatus.value,createdBy:state.user.id,foodIds})});menus()}catch(e){alert(e.message)}}
async function closeMenu(id){if(confirm("Đóng thực đơn?")){await api("/menus/"+id,{method:"DELETE"});menus()}}

async function goodsPageSearch(){return api("/goods?q="+encodeURIComponent(document.getElementById("goodSearch")?.value||""))}
async function goods(){
  try {
    const list = await api("/goods?q=");

    document.getElementById("page").innerHTML = `
      <div class="toolbar">
        <input
          id="goodSearch"
          placeholder="Tìm mã, tên, nhóm, trạng thái"
        >

        <button type="button" onclick="goodsSearch()">
          Tìm kiếm
        </button>

        <button type="button" onclick="goodForm()">
          ＋ Thêm hàng hóa
        </button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>Nhóm</th>
              <th>ĐVT</th>
              <th>Tồn</th>
              <th>Giữ chỗ</th>
              <th>Khả dụng</th>
              <th>Tối thiểu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            ${
              list.length
              ? list.map(g => `
                <tr>
                  <td>${esc(g.code || "")}</td>
                  <td>${esc(g.name || "")}</td>
                  <td>${esc(g.groupName || "")}</td>
                  <td>${esc(g.unit || "")}</td>

                  <td>
                    ${Number(g.quantity || 0)}
                  </td>

                  <td>
                    ${Number(g.reservedQuantity || 0)}
                  </td>

                  <td>
                    ${(
                      Number(g.quantity || 0) -
                      Number(g.reservedQuantity || 0)
                    ).toFixed(3)}
                  </td>

                  <td>
                    ${Number(g.minQuantity || 0)}
                  </td>

                  <td>
                    ${statusText(g.status)}
                  </td>

                  <td>
                    <button
                      type="button"
                      onclick="editGood(${Number(g.id)})">
                      ✏ Sửa
                    </button>
                  </td>
                </tr>
              `).join("")
              : `
                <tr>
                  <td colspan="10" style="text-align:center">
                    Chưa có hàng hóa
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;

  } catch(e) {
    console.error("Lỗi goods():", e);
    alert(e.message || "Không thể tải danh sách hàng hóa.");
  }
}
async function editGood(id){
  try {
    if (!id) {
      throw new Error("ID hàng hóa không hợp lệ.");
    }

    console.log("Đang lấy hàng hóa ID:", id);

    const g = await api("/goods/" + id);

    console.log("Thông tin hàng hóa:", g);

    if (!g || !g.id) {
      throw new Error("Không tìm thấy hàng hóa.");
    }

    goodForm(g);

  } catch(e) {
    console.error("Lỗi editGood():", e);
    alert(e.message || "Không thể mở thông tin hàng hóa.");
  }
}
async function goodsSearch(){
  try {
    const list = await goodsPageSearch();

    const wrap = document.getElementById("page")
      .querySelector(".table-wrap");

    if (!wrap) return;

    wrap.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>Nhóm</th>
            <th>ĐVT</th>
            <th>Tồn</th>
            <th>Giữ chỗ</th>
            <th>Khả dụng</th>
            <th>Tối thiểu</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          ${
            list.length
            ? list.map(g => `
              <tr>
                <td>${esc(g.code || "")}</td>
                <td>${esc(g.name || "")}</td>
                <td>${esc(g.groupName || "")}</td>
                <td>${esc(g.unit || "")}</td>
                <td>${Number(g.quantity || 0)}</td>
                <td>${Number(g.reservedQuantity || 0)}</td>

                <td>
                  ${(
                    Number(g.quantity || 0) -
                    Number(g.reservedQuantity || 0)
                  ).toFixed(3)}
                </td>

                <td>${Number(g.minQuantity || 0)}</td>

                <td>
                  ${statusText(g.status)}
                </td>

                <td>
                  <button
                    type="button"
                    onclick="editGood(${Number(g.id)})">
                    ✏ Sửa
                  </button>
                </td>
              </tr>
            `).join("")
            : `
              <tr>
                <td colspan="10" style="text-align:center">
                  Không tìm thấy hàng hóa
                </td>
              </tr>
            `
          }
        </tbody>
      </table>
    `;
  } catch(e) {
    console.error("Lỗi goodsSearch():", e);
    alert(e.message || "Không thể tìm kiếm hàng hóa.");
  }
}
function goodForm(g = {}) {

  const isEdit = !!g.id;

  document.getElementById("page").innerHTML = `
    <div class="card form-card">

      <h3>
        ${isEdit ? "Cập nhật hàng hóa" : "Thêm hàng hóa"}
      </h3>

      <div class="form-grid">

        <div>
          <label>Mã hàng</label>
          <input
            id="gCode"
            type="text"
            placeholder="Mã hàng"
            value="${esc(g.code || "")}">
        </div>

        <div>
          <label>Tên hàng</label>
          <input
            id="gName"
            type="text"
            placeholder="Tên hàng"
            value="${esc(g.name || "")}">
        </div>

        <div>
          <label>Nhóm hàng</label>
          <input
            id="gGroup"
            type="text"
            placeholder="Nhóm hàng"
            value="${esc(g.groupName || "")}">
        </div>

        <div>
          <label>Đơn vị</label>
          <input
            id="gUnit"
            type="text"
            placeholder="Đơn vị"
            value="${esc(g.unit || "")}">
        </div>

        <div>
          <label>Số lượng tồn</label>
          <input
            id="gQty"
            type="number"
            min="0"
            step="0.001"
            value="${Number(g.quantity || 0)}">
        </div>

        <div>
          <label>Mức tồn tối thiểu</label>
          <input
            id="gMin"
            type="number"
            min="0"
            step="0.001"
            value="${Number(g.minQuantity || 0)}">
        </div>

        <div class="full">
          <label>Nhà cung cấp</label>
          <input
            id="gSupplier"
            type="text"
            placeholder="Nhà cung cấp"
            value="${esc(g.supplier || "")}">
        </div>

        <div>
          <label>Trạng thái</label>

          <select id="gStatus">
            <option value="ACTIVE">
              Đang sử dụng
            </option>

            <option value="STOPPED">
              Ngừng sử dụng
            </option>
          </select>
        </div>

        <div class="full">

          <button
            type="button"
            onclick="saveGood(${isEdit ? Number(g.id) : 0})">
            ${isEdit ? "💾 Lưu thay đổi" : "＋ Thêm hàng hóa"}
          </button>

          <button
            type="button"
            class="secondary"
            onclick="goods()">
            Hủy
          </button>

        </div>

      </div>
    </div>
  `;

  document.getElementById("gStatus").value =
    g.status || "ACTIVE";
}
async function saveGood(id) {
  try {

    const code = document.getElementById("gCode").value.trim();
    const name = document.getElementById("gName").value.trim();
    const groupName = document.getElementById("gGroup").value.trim();
    const unit = document.getElementById("gUnit").value.trim();

    const quantity =
      Number(document.getElementById("gQty").value);

    const minQuantity =
      Number(document.getElementById("gMin").value);

    const supplier =
      document.getElementById("gSupplier").value.trim();

    const status =
      document.getElementById("gStatus").value;

    if (!code) {
      alert("Vui lòng nhập mã hàng.");
      return;
    }

    if (!name) {
      alert("Vui lòng nhập tên hàng.");
      return;
    }

    if (!unit) {
      alert("Vui lòng nhập đơn vị.");
      return;
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      alert("Số lượng tồn không hợp lệ.");
      return;
    }

    if (Number.isNaN(minQuantity) || minQuantity < 0) {
      alert("Mức tồn tối thiểu không hợp lệ.");
      return;
    }

    const body = {
      id: Number(id || 0),
      code: code,
      name: name,
      groupName: groupName,
      unit: unit,
      quantity: quantity,
      minQuantity: minQuantity,
      supplier: supplier,
      status: status
    };

    console.log("===== SAVE GOOD =====");
    console.log("ID:", id);
    console.log("BODY:", body);

    const result = await api(
      id
        ? "/goods/" + id
        : "/goods",
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(body)
      }
    );

    console.log("API RESULT:", result);

    alert(
      id
        ? "Cập nhật hàng hóa thành công!"
        : "Thêm hàng hóa thành công!"
    );

    await goods();

  } catch(e) {
    console.error("Lỗi saveGood():", e);
    alert(e.message || "Không thể lưu hàng hóa.");
  }
}

async function inventory(){const [all,low]=await Promise.all([api("/goods?q="),api("/goods/low-stock")]);document.getElementById("page").innerHTML=`<div class="grid"><div class="card"><div class="muted2">Tổng mặt hàng</div><div class="stat">${all.length}</div></div><div class="card"><div class="muted2">Sắp hết</div><div class="stat">${low.length}</div></div></div><div class="card" style="margin-top:15px"><h3>Cảnh báo tồn kho</h3>${low.length?`<div class="table-wrap"><table class="table"><tr><th>Mã</th><th>Hàng hóa</th><th>Khả dụng</th><th>Tối thiểu</th></tr>${low.map(g=>`<tr><td>${g.code}</td><td>${esc(g.name)}</td><td>${(g.quantity-g.reservedQuantity).toFixed(3)} ${g.unit}</td><td>${g.minQuantity}</td></tr>`).join("")}</table></div>`:`<div class="success">Không có hàng hóa sắp hết.</div>`}</div>`}

async function purchases(){const list=await api("/purchases");document.getElementById("page").innerHTML=`<div class="toolbar"><button onclick="purchaseForm()">＋ Lập phiếu nhập</button></div><div class="table-wrap"><table class="table"><tr><th>Mã phiếu</th><th>Nhà cung cấp</th><th>Ngày</th><th>Tổng</th><th>Trạng thái</th><th></th></tr>${list.map(p=>`<tr><td>${p.receipt_code}</td><td>${esc(p.supplier||"")}</td><td>${fmt(p.receipt_date)}</td><td>${money(p.total_amount)}</td><td>${statusText(p.status)}</td><td>${p.status==="DRAFT"?`<button onclick="editPurchase(${p.id})">Sửa</button><button onclick="confirmPurchase(${p.id})">Xác nhận</button>`:""}</td></tr>`).join("")}</table></div>`}
async function purchaseForm(){const gs=await api("/goods?q=");window.purchaseGoods=gs;document.getElementById("page").innerHTML=`<div class="card form-card"><h3>Lập phiếu nhập</h3><input id="pSupplier" placeholder="Nhà cung cấp"><input id="pCode" placeholder="Mã phiếu, để trống tự tạo"><div id="purchaseRows">${purchaseRowHtml(gs)}</div><button class="secondary" onclick="addPurchaseRow()">＋ Mặt hàng</button><button onclick="savePurchase()">Lưu nháp</button></div>`}
function purchaseRowHtml(gs,x={}){return `<div class="ing-row"><select class="p-good">${gs.map(g=>`<option value="${g.id}" ${Number(x.good_id)===g.id?"selected":""}>${esc(g.code)} - ${esc(g.name)}</option>`).join("")}</select><input class="p-qty" type="number" min="0.001" step="0.001" placeholder="Số lượng" value="${x.quantity??""}"><input class="p-price" type="number" min="0" step="100" placeholder="Đơn giá" value="${x.unit_price??""}"><button class="danger" onclick="this.parentElement.remove()">X</button></div>`}
function addPurchaseRow(){document.getElementById("purchaseRows").insertAdjacentHTML("beforeend",purchaseRowHtml(window.purchaseGoods||[]))}
async function savePurchase(){try{const items=[...document.querySelectorAll("#purchaseRows .ing-row")].map(r=>({goodId:Number(r.querySelector(".p-good").value),quantity:Number(r.querySelector(".p-qty").value),unitPrice:Number(r.querySelector(".p-price").value)}));await api("/purchases",{method:"POST",body:JSON.stringify({receiptCode:pCode.value,supplier:pSupplier.value,createdBy:state.user.id,items})});purchases()}catch(e){alert(e.message)}}
async function editPurchase(id){try{const p=await api("/purchases/"+id);const gs=await api("/goods?q=");window.purchaseGoods=gs;document.getElementById("page").innerHTML=`<div class="card form-card"><h3>Sửa phiếu nhập ${esc(p.receipt_code)}</h3><input id="pSupplier" value="${esc(p.supplier||"")}"><div id="purchaseRows">${(p.items||[]).map(x=>purchaseRowHtml(gs,x)).join("")}</div><button class="secondary" onclick="addPurchaseRow()">＋ Mặt hàng</button><button onclick="savePurchaseEdit(${id})">Lưu thay đổi</button></div>`}catch(e){alert(e.message)}}
async function savePurchaseEdit(id){try{const items=[...document.querySelectorAll("#purchaseRows .ing-row")].map(r=>({goodId:Number(r.querySelector(".p-good").value),quantity:Number(r.querySelector(".p-qty").value),unitPrice:Number(r.querySelector(".p-price").value)}));await api("/purchases/"+id,{method:"PUT",body:JSON.stringify({supplier:pSupplier.value,items})});purchases()}catch(e){alert(e.message)}}
async function confirmPurchase(id){try{await api("/purchases/"+id+"/confirm",{method:"PUT"});purchases()}catch(e){alert(e.message)}}

async function orders(){const qs=new URLSearchParams();if(state.user.role==="CUSTOMER")qs.set("customerId",state.user.id);else{if(document.getElementById("oq"))qs.set("q",document.getElementById("oq").value);if(document.getElementById("os"))qs.set("status",document.getElementById("os").value);if(document.getElementById("ops"))qs.set("paymentStatus",document.getElementById("ops").value);if(document.getElementById("ofrom"))qs.set("from",document.getElementById("ofrom").value);if(document.getElementById("oto"))qs.set("to",document.getElementById("oto").value)}const list=await api("/orders?"+qs.toString());document.getElementById("page").innerHTML=`${state.user.role!=="CUSTOMER"?`<div class="toolbar"><input id="oq" placeholder="Mã đơn / tên khách hàng"><select id="os"><option value="">Tất cả trạng thái</option><option value="PENDING">Chờ xác nhận</option><option value="CONFIRMED">Đã xác nhận</option><option value="PREPARING">Đang chuẩn bị</option><option value="READY">Sẵn sàng</option><option value="COMPLETED">Hoàn thành</option><option value="CANCELLED">Đã hủy</option></select><select id="ops"><option value="">Tất cả thanh toán</option><option value="UNPAID">Chưa thanh toán</option><option value="PAID">Đã thanh toán</option><option value="REFUNDED">Đã hoàn tiền</option></select><input id="ofrom" type="date"><input id="oto" type="date"><button onclick="orders()">Tra cứu</button></div>`:""}<div class="table-wrap"><table class="table"><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng</th><th>Đơn</th><th>Thanh toán</th><th>Ngày</th><th>Thao tác</th></tr>${list.map(o=>`<tr><td>${o.order_code}</td><td>${esc(o.customer_name)}</td><td>${money(o.total_amount)}</td><td>${statusText(o.status)}</td><td>${statusText(o.payment_status)}</td><td>${fmt(o.created_at)}</td><td><button onclick="orderDetail(${o.id})">Chi tiết</button>${state.user.role==="CUSTOMER"&&o.status==="PENDING"?`<button class="danger" onclick="cancelOrder(${o.id})">Hủy</button>`:""}${state.user.role!=="CUSTOMER"?`<button onclick="orderActions(${o.id},'CONFIRMED')">Xác nhận</button><button onclick="orderActions(${o.id},'PREPARING')">Đang chuẩn bị</button><button onclick="orderActions(${o.id},'READY')">Sẵn sàng</button><button onclick="orderActions(${o.id},'COMPLETED')">Hoàn thành</button><button class="danger" onclick="orderActions(${o.id},'CANCELLED')">Từ chối/Hủy</button>`:""}</td></tr>`).join("")}</table></div>`}
async function orderDetail(id){const o=await api("/orders/"+id);document.getElementById("page").innerHTML=`<div class="card"><h3>Đơn ${o.order_code}</h3><p>${esc(o.customer_name)} · ${fmt(o.created_at)}</p>${o.items.map(i=>`<div class="cart-row"><div><b>${esc(i.food_name)}</b> × ${i.quantity}<div>Topping: ${(i.toppings||[]).map(t=>esc(t.topping_name)).join(", ")||"Không"}</div></div><b>${money(i.subtotal)}</b></div>`).join("")}<hr><h3>Tổng: ${money(o.total_amount)}</h3><p>Đơn: ${statusText(o.status)} · Thanh toán: ${statusText(o.payment_status)}</p><button class="secondary" onclick="orders()">Quay lại</button></div>`}
async function orderActions(id,status){try{const reason=status==="CANCELLED"?prompt("Lý do:",""):"";await api("/orders/"+id+"/status",{method:"PUT",body:JSON.stringify({status,reason,changedBy:state.user.id})});orders()}catch(e){alert(e.message)}}
async function cancelOrder(id){try{const reason=prompt("Lý do hủy:","");if(reason===null)return;await api("/orders/"+id,{method:"DELETE",body:JSON.stringify({reason})});orders()}catch(e){alert(e.message)}}

async function payments(){const list=await api("/orders");const pending=list.filter(o=>o.payment_status==="UNPAID");const paid=list.filter(o=>o.payment_status==="PAID"&&o.status!=="COMPLETED");document.getElementById("page").innerHTML=`<div class="alert">${pending.length} đơn chưa thanh toán.</div><div class="table-wrap"><table class="table"><tr><th>Mã</th><th>Tổng</th><th>Phương thức</th><th></th></tr>${pending.map(o=>`<tr><td>${o.order_code}</td><td>${money(o.total_amount)}</td><td>${o.payment_method||""}</td><td><button onclick="payForm(${o.id},${o.total_amount},'${o.payment_method||'CASH'}')">Xác nhận</button></td></tr>`).join("")}${paid.map(o=>`<tr><td>${o.order_code}</td><td>${money(o.total_amount)}</td><td>${o.payment_method||""}</td><td><button class="danger" onclick="refund(${o.id})">Hoàn tiền</button></td></tr>`).join("")}</table></div>`}
function payForm(id,amount,method){const code=prompt("Mã giao dịch (nếu QR/chuyển khoản):","");if(code===null)return;api("/payments",{method:"POST",body:JSON.stringify({orderId:id,amount,method,transactionCode:code,confirmedBy:state.user.id})}).then(payments).catch(e=>alert(e.message))}
async function refund(id){if(!confirm("Xác nhận hoàn tiền cho đơn này?"))return;try{await api("/payments/order/"+id,{method:"PUT",body:JSON.stringify({confirmedBy:state.user.id})});payments()}catch(e){alert(e.message)}}

async function users(){
  try {
    const list = (await api("/users")).filter(u => u.role !== "CUSTOMER");

    document.getElementById("page").innerHTML = `
      <div class="page-header">
        <div>
          <h2>Quản lý nhân viên</h2>
          <p>Quản lý tài khoản nhân viên và quản lý trong hệ thống</p>
        </div>

        <button class="user-add-btn" onclick="userForm()">
          ＋ Thêm nhân viên
        </button>
      </div>

      <div class="user-table-card">
        <div class="user-table-header">
          <div>
            <h3>Danh sách nhân viên</h3>
            <span>${list.length} tài khoản</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table user-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              ${
                list.length
                ? list.map(u => `
                  <tr>
                    <td>
                      <div class="user-name-cell">
                        <div class="user-avatar">
                          ${esc((u.fullName || "N").charAt(0).toUpperCase())}
                        </div>

                        <div>
                          <strong>${esc(u.fullName || "")}</strong>
                        </div>
                      </div>
                    </td>

                    <td>${esc(u.email || "")}</td>

                    <td>${esc(u.phone || "—")}</td>

                    <td>
                      <span class="role-badge ${
                        u.role === "MANAGER" ? "manager" : "staff"
                      }">
                        ${roleName(u.role)}
                      </span>
                    </td>

                    <td>
                      <span class="status-badge ${
                        u.status === "ACTIVE" ? "active" : "inactive"
                      }">
                        ${statusText(u.status)}
                      </span>
                    </td>

                    <td>
                      <button
    type="button"
  class="user-edit-btn"
  onclick="editUser(${Number(u.id)})">
  ✏ Sửa
</button>
                    </td>
                  </tr>
                `).join("")
                : `
                  <tr>
                    <td colspan="6" class="empty-user">
                      Chưa có nhân viên nào
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

  } catch (e) {
    console.error("Lỗi users():", e);
    alert(e.message || "Không thể tải danh sách nhân viên.");
  }
}
async function editUser(id) {
  try {
    console.log("Đang lấy thông tin user ID:", id);

    const u = await api(`/users/${id}`);

    console.log("User nhận được:", u);

    if (!u || !u.id) {
      throw new Error("Không tìm thấy thông tin tài khoản.");
    }

    userForm(u);

  } catch (e) {
    console.error("Lỗi editUser():", e);
    alert(e.message || "Không thể mở thông tin tài khoản.");
  }
}

function userForm(u = {}){
  const isEdit = !!u.id;

  document.getElementById("page").innerHTML = `
    <div class="user-form-card">

      <div class="user-form-header">
        <div class="user-form-icon">
          ${isEdit ? "✏" : "👤"}
        </div>

        <div>
          <h3>${isEdit ? "Cập nhật nhân viên" : "Thêm nhân viên"}</h3>
          <p>
            ${
              isEdit
              ? "Cập nhật thông tin tài khoản nhân viên"
              : "Tạo tài khoản mới cho nhân viên trong hệ thống"
            }
          </p>
        </div>
      </div>

      <div class="user-form-body">

        <div class="user-form-section">
          <h4>Thông tin cá nhân</h4>

          <div class="user-form-grid">

            <div class="user-field">
              <label>Họ và tên <span>*</span></label>
              <input
                id="uName"
                type="text"
                placeholder="Nhập họ và tên"
                value="${esc(u.fullName || "")}">
            </div>

            <div class="user-field">
              <label>Email <span>*</span></label>
              <input
                id="uEmail"
                type="email"
                placeholder="Nhập địa chỉ email"
                value="${esc(u.email || "")}">
            </div>

            <div class="user-field">
              <label>Số điện thoại</label>
              <input
                id="uPhone"
                type="text"
                placeholder="Nhập số điện thoại"
                value="${esc(u.phone || "")}">
            </div>

            <div class="user-field">
              <label>Vai trò <span>*</span></label>
              <select id="uRole">
                <option value="STAFF">Nhân viên</option>
                <option value="MANAGER">Quản lý</option>
              </select>
            </div>

            <div class="user-field">
              <label>Trạng thái</label>
              <select id="uStatus">
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Khóa</option>
              </select>
            </div>

            ${
              isEdit
              ? ""
              : `
                <div class="user-field">
                  <label>Mật khẩu <span>*</span></label>

                  <div class="user-password-input">
                    <input
                      id="uPass"
                      type="password"
                      placeholder="Nhập mật khẩu">

                    <button
                      type="button"
                      class="user-password-toggle"
                      onclick="togglePassword('uPass', this)">
                      👁
                    </button>
                  </div>
                </div>
              `
            }

          </div>
        </div>

        ${
          !isEdit
          ? `
            <div class="user-form-note">
              <span>💡</span>
              <div>
                <b>Lưu ý khi tạo tài khoản</b>
                <p>
                  Mật khẩu nên có ít nhất 6 ký tự.
                  Hãy kiểm tra kỹ thông tin trước khi tạo tài khoản.
                </p>
              </div>
            </div>
          `
          : ""
        }

      </div>

      <div class="user-form-actions">
        <button
          class="user-save-btn"
          onclick="saveUser(${u.id || 0})">
          ${isEdit ? "💾 Lưu thay đổi" : "＋ Thêm nhân viên"}
        </button>

        <button
          class="user-cancel-btn"
          onclick="users()">
          Hủy
        </button>
      </div>

    </div>
  `;

  document.getElementById("uRole").value = u.role || "STAFF";
  document.getElementById("uStatus").value = u.status || "ACTIVE";
}
//async function saveUser(id){try{const b={fullName:uName.value,email:uEmail.value,phone:uPhone.value,role:uRole.value,status:uStatus.value};if(!id)b.password=uPass.value;await api(id?"/users/"+id:"/users",{method:id?"PUT":"POST",body:JSON.stringify(b)});users()}catch(e){alert(e.message)}}
async function saveUser(id) {
  try {
    const nameEl = document.getElementById("uName");
    const emailEl = document.getElementById("uEmail");
    const phoneEl = document.getElementById("uPhone");
    const roleEl = document.getElementById("uRole");
    const statusEl = document.getElementById("uStatus");

    if (!nameEl || !emailEl || !roleEl || !statusEl) {
      throw new Error("Không tìm thấy biểu mẫu người dùng.");
    }

    const fullName = nameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const role = roleEl.value;
    const status = statusEl.value;

    if (!fullName) {
      alert("Vui lòng nhập họ và tên.");
      nameEl.focus();
      return;
    }

    if (!email) {
      alert("Vui lòng nhập email.");
      emailEl.focus();
      return;
    }

    const body = {
      fullName,
      email,
      phone,
      role,
      status
    };

    // Các trường này chỉ gửi nếu form có tồn tại
    const birthDateEl = document.getElementById("uBirthDate");
    const addressEl = document.getElementById("uAddress");
    const avatarEl = document.getElementById("uAvatarUrl");

    if (birthDateEl) {
      body.birthDate = birthDateEl.value.trim();
    }

    if (addressEl) {
      body.address = addressEl.value.trim();
    }

    if (avatarEl) {
      body.avatarUrl = avatarEl.value.trim();
    }

    // Thêm mới mới cần password
    if (!id) {
      const passEl = document.getElementById("uPass");

      if (!passEl || !passEl.value.trim()) {
        alert("Vui lòng nhập mật khẩu.");
        if (passEl) passEl.focus();
        return;
      }

      if (passEl.value.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự.");
        passEl.focus();
        return;
      }

      body.password = passEl.value;
    }

    console.log("===== SAVE USER =====");
    console.log("ID:", id);
    console.log("METHOD:", id ? "PUT" : "POST");
    console.log("URL:", id ? `/users/${id}` : "/users");
    console.log("BODY:", body);

    const result = await api(
      id ? `/users/${id}` : "/users",
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(body)
      }
    );

    console.log("API RESULT:", result);

    alert(
      id
        ? "Cập nhật thông tin thành công!"
        : "Thêm nhân viên thành công!"
    );

    await users();

  } catch (e) {
    console.error("Lỗi saveUser:", e);
    alert(e.message || "Không thể lưu thông tin người dùng.");
  }
}

function profile(){
  document.getElementById("page").innerHTML = `
    <div class="profile-card">

      <div class="profile-header">
        <div>
          <h3>Thông tin cá nhân</h3>
          <p>Quản lý thông tin tài khoản của bạn</p>
        </div>
        <div class="profile-avatar">👤</div>
      </div>

      <div class="profile-form">

        <div class="profile-field">
          <label>Họ và tên</label>
          <input
            id="pName"
            type="text"
            value="${esc(state.user.fullName)}"
          >
        </div>

        <div class="profile-field">
          <label>Email</label>
          <input
            id="pEmail"
            type="email"
            value="${esc(state.user.email)}"
          >
        </div>

        <div class="profile-field">
          <label>Số điện thoại</label>
          <input
            id="pPhone"
            type="text"
            value="${esc(state.user.phone || "")}"
          >
        </div>

        <div class="profile-field">
          <label>Ngày sinh</label>
          <input
            id="pBirth"
            type="date"
            value="${esc(state.user.birthDate || "")}"
          >
        </div>

        <div class="profile-field profile-full">
          <label>Địa chỉ</label>
          <input
            id="pAddress"
            type="text"
            placeholder="Nhập địa chỉ"
            value="${esc(state.user.address || "")}"
          >
        </div>

        <div class="profile-field">
          <label>Vai trò</label>
          <input
            type="text"
            value="${roleName(state.user.role)}"
            disabled
          >
        </div>

      </div>

      <div class="profile-actions">
        <button
          class="profile-btn-update"
          onclick="updateProfile()">
          Cập nhật
        </button>

        <button
          class="profile-btn-password"
          onclick="passwordForm()">
          Đổi mật khẩu
        </button>
      </div>

    </div>
  `;
}
async function updateProfile() {
  try {
    const nameEl = document.getElementById("pName");
    const emailEl = document.getElementById("pEmail");
    const phoneEl = document.getElementById("pPhone");
    const birthEl = document.getElementById("pBirth");
    const addressEl = document.getElementById("pAddress");

    if (!nameEl || !emailEl || !phoneEl || !birthEl || !addressEl) {
      throw new Error("Không tìm thấy đầy đủ thông tin tài khoản.");
    }

    const fullName = nameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl.value.trim();
    const birthDate = birthEl.value.trim();
    const address = addressEl.value.trim();

    if (!fullName) {
      alert("Vui lòng nhập họ và tên.");
      nameEl.focus();
      return;
    }

    if (!email) {
      alert("Vui lòng nhập email.");
      emailEl.focus();
      return;
    }

    const body = {
      fullName,
      email,
      phone,
      role: state.user.role,
      status: state.user.status || "ACTIVE",
      birthDate,
      address,
      avatarUrl: state.user.avatarUrl || ""
    };

    console.log("===== UPDATE PROFILE =====");
    console.log("USER ID:", state.user.id);
    console.log("BODY:", body);

    const result = await api(
      `/users/${state.user.id}`,
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    console.log("UPDATE RESULT:", result);

    // Lấy lại thông tin mới từ database
    const updatedUser = await api(`/users/${state.user.id}`);

    // Cập nhật localStorage
    state.user = updatedUser;
    localStorage.setItem(
      "canteenUser",
      JSON.stringify(updatedUser)
    );

    alert("Cập nhật thông tin thành công!");

    profile();

  } catch (e) {
    console.error("Lỗi updateProfile:", e);
    alert(e.message || "Không thể cập nhật thông tin.");
  }
}
function passwordForm(){
  document.getElementById("page").innerHTML = `
    <div class="password-card">

      <div class="password-header">
        <div class="password-icon">🔒</div>
        <div>
          <h3>Đổi mật khẩu</h3>
          <p>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
        </div>
      </div>

      <div class="password-form">

        <div class="password-field">
          <label>Mật khẩu hiện tại</label>
          <div class="password-input">
            <input
              id="oldPass"
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
            >
            <button
              type="button"
              class="password-toggle"
              onclick="togglePassword('oldPass', this)">
              👁
            </button>
          </div>
        </div>

        <div class="password-field">
          <label>Mật khẩu mới</label>
          <div class="password-input">
            <input
              id="newPass"
              type="password"
              placeholder="Nhập mật khẩu mới"
            >
            <button
              type="button"
              class="password-toggle"
              onclick="togglePassword('newPass', this)">
              👁
            </button>
          </div>
        </div>

        <div class="password-field">
          <label>Xác nhận mật khẩu mới</label>
          <div class="password-input">
            <input
              id="confirmPass"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
            >
            <button
              type="button"
              class="password-toggle"
              onclick="togglePassword('confirmPass', this)">
              👁
            </button>
          </div>
        </div>

        <div class="password-note">
          <span>💡</span>
          <div>
            <b>Lưu ý</b>
            <p>
              Mật khẩu mới nên có ít nhất 6 ký tự và không nên
              trùng với mật khẩu cũ.
            </p>
          </div>
        </div>

      </div>

      <div class="password-actions">
        <button
          class="password-save"
          onclick="changePassword()">
          Đổi mật khẩu
        </button>

        <button
          class="password-cancel"
          onclick="profile()">
          Hủy
        </button>
      </div>

    </div>
  `;
}
function togglePassword(id, button){
  const input = document.getElementById(id);

  if(input.type === "password"){
    input.type = "text";
    button.textContent = "🙈";
  }else{
    input.type = "password";
    button.textContent = "👁";
  }
}

async function changePassword(){try{await api("/users/"+state.user.id+"/password",{method:"PUT",body:JSON.stringify({currentPassword:oldPass.value,newPassword:newPass.value,confirmPassword:confirmPass.value})});alert("Đổi mật khẩu thành công");profile()}catch(e){alert(e.message)}}

async function reports() {
  try {
    const [r, o, b, i] = await Promise.all([
      api("/reports/revenue"),
      api("/reports/orders"),
      api("/reports/best-selling?limit=10"),
      api("/reports/inventory")
    ]);

    const orderData = Array.isArray(o) ? o : [];
    const bestData = Array.isArray(b) ? b : [];
    const inventoryData = Array.isArray(i) ? i : [];

    document.getElementById("page").innerHTML = `
      <style>
        .report-page {
          width: 100%;
        }

        .report-toolbar {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .report-toolbar button {
          border: none;
          padding: 11px 17px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }

        .report-toolbar .excel-btn {
          background: #16834a;
          color: white;
        }

        .report-toolbar .pdf-btn {
          background: #334155;
          color: white;
        }

        /* =========================
           SUMMARY
        ========================= */

        .report-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 18px;
        }

        .report-summary-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 3px 12px rgba(0,0,0,.035);
        }

        .report-summary-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          background: #ecfdf5;
        }

        .report-summary-label {
          color: #64748b;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .report-summary-number {
          color: #172b4d;
          font-size: 25px;
          font-weight: 700;
        }

        /* =========================
           CHART GRID
        ========================= */

        .report-chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .report-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 3px 12px rgba(0,0,0,.035);
          min-width: 0;
        }

        .report-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .report-card-title h3 {
          margin: 0;
          font-size: 17px;
          color: #172b4d;
        }

        .report-card-subtitle {
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .report-chart-box {
          position: relative;
          width: 100%;
          min-width: 0;
        }

        .report-chart-box canvas {
          display: block;
          width: 100%;
          height: 300px;
        }

        .report-chart-full {
          grid-column: 1 / -1;
        }

        /* =========================
           LEGEND
        ========================= */

        .report-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 9px 18px;
          margin-top: 5px;
          font-size: 12px;
        }

        .report-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
        }

        .report-legend-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        /* =========================
           TOP FOOD
        ========================= */

        .food-ranking {
          margin-top: 4px;
        }

        .food-ranking-row {
          display: grid;
          grid-template-columns: 30px 1fr 42px;
          align-items: center;
          gap: 8px;
          margin-bottom: 15px;
        }

        .food-ranking-number {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }

        .food-ranking-info {
          min-width: 0;
        }

        .food-ranking-name {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 6px;
        }

        .food-ranking-track {
          width: 100%;
          height: 8px;
          background: #eef2f7;
          border-radius: 99px;
          overflow: hidden;
        }

        .food-ranking-bar {
          height: 100%;
          background: #16834a;
          border-radius: 99px;
        }

        .food-ranking-value {
          font-size: 13px;
          font-weight: 700;
          color: #172b4d;
          text-align: right;
        }

        /* =========================
           TABLE
        ========================= */

        .report-table-wrap {
          overflow-x: auto;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
        }

        .report-table th,
        .report-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          font-size: 13px;
        }

        .report-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
        }

        .report-table td {
          color: #334155;
        }

        .report-empty {
          text-align: center !important;
          color: #94a3b8 !important;
          padding: 40px 10px !important;
        }

        .report-status {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .report-status-low {
          background: #fff7ed;
          color: #c2410c;
        }

        .report-status-ok {
          background: #ecfdf5;
          color: #15803d;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media(max-width: 900px) {
          .report-chart-grid {
            grid-template-columns: 1fr;
          }

          .report-chart-full {
            grid-column: auto;
          }
        }

        @media(max-width: 600px) {
          .report-summary {
            grid-template-columns: 1fr;
          }

          .report-card {
            padding: 15px;
          }
        }
      </style>

      <div class="report-page">

        <!-- =====================
             NÚT XUẤT BÁO CÁO
        ====================== -->

        <div class="report-toolbar">
          <button
            class="excel-btn"
            onclick="downloadReport('xlsx')">
            Xuất Excel (.xlsx)
          </button>

          <button
            class="pdf-btn"
            onclick="downloadReport('pdf')">
            Xuất PDF (.pdf)
          </button>
        </div>


        <!-- =====================
             TỔNG QUAN
        ====================== -->

        <div class="report-summary">

          <div class="report-summary-card">

            <div class="report-summary-icon">
              💰
            </div>

            <div>
              <div class="report-summary-label">
                Tổng doanh thu
              </div>

              <div class="report-summary-number">
                ${money(r.revenue || 0)}
              </div>
            </div>

          </div>


          <div class="report-summary-card">

            <div class="report-summary-icon">
              🧾
            </div>

            <div>
              <div class="report-summary-label">
                Đơn đã thanh toán
              </div>

              <div class="report-summary-number">
                ${Number(r.order_count || 0)}
              </div>
            </div>

          </div>

        </div>


        <!-- =====================
             BIỂU ĐỒ
        ====================== -->

        <div class="report-chart-grid">


          <!-- TRẠNG THÁI ĐƠN -->

          <div class="report-card">

            <div class="report-card-title">
              <h3>📊 Thống kê đơn hàng</h3>
            </div>

            <div class="report-card-subtitle">
              Phân bố đơn hàng theo trạng thái
            </div>

            <div class="report-chart-box">
              <canvas id="orderChart"></canvas>
            </div>

            <div
              id="orderLegend"
              class="report-legend">
            </div>

          </div>


          <!-- TOP MÓN -->

          <div class="report-card">

            <div class="report-card-title">
              <h3>🔥 Top món bán chạy</h3>
            </div>

            <div class="report-card-subtitle">
              Những món được đặt nhiều nhất
            </div>

            <div id="foodRanking" class="food-ranking"></div>

          </div>


          <!-- TỒN KHO -->

          <div class="report-card report-chart-full">

            <div class="report-card-title">
              <h3>📦 Tình hình tồn kho</h3>
            </div>

            <div class="report-card-subtitle">
              So sánh số lượng khả dụng với mức tồn tối thiểu
            </div>

            <div class="report-chart-box">
              <canvas id="inventoryChart"></canvas>
            </div>

            <div
              id="inventoryLegend"
              class="report-legend">
            </div>

          </div>

        </div>


        <!-- =====================
             CHI TIẾT TOP MÓN
        ====================== -->

        <div
          class="report-card"
          style="margin-bottom:18px">

          <div class="report-card-title">
            <h3>🍜 Chi tiết món ăn bán chạy</h3>
          </div>

          <div class="report-card-subtitle">
            Danh sách món ăn theo số lượng đã bán
          </div>

          <div class="report-table-wrap">

            <table class="report-table">

              <thead>
                <tr>
                  <th>Món ăn</th>
                  <th>Số lượng bán</th>
                </tr>
              </thead>

              <tbody>

                ${
                  bestData.length

                  ? bestData.map(x => `
                    <tr>
                      <td>${esc(x.name)}</td>

                      <td>
                        <b>${Number(x.quantity || 0)}</b>
                      </td>
                    </tr>
                  `).join("")

                  : `
                    <tr>
                      <td
                        colspan="2"
                        class="report-empty">
                        Chưa có dữ liệu bán hàng
                      </td>
                    </tr>
                  `
                }

              </tbody>

            </table>

          </div>

        </div>


        <!-- =====================
             CHI TIẾT TỒN KHO
        ====================== -->

        <div class="report-card">

          <div class="report-card-title">
            <h3>📦 Chi tiết tồn kho</h3>
          </div>

          <div class="report-card-subtitle">
            Theo dõi số lượng hàng hóa hiện tại
          </div>

          <div class="report-table-wrap">

            <table class="report-table">

              <thead>
                <tr>
                  <th>Mã hàng</th>
                  <th>Hàng hóa</th>
                  <th>Khả dụng</th>
                  <th>Tối thiểu</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>

                ${
                  inventoryData.length

                  ? inventoryData.map(x => {

                      const available =
                        Number(x.available_quantity || 0);

                      const min =
                        Number(x.min_quantity || 0);

                      const low =
                        available <= min;

                      return `
                        <tr>

                          <td>
                            ${esc(x.code || "")}
                          </td>

                          <td>
                            <b>${esc(x.name || "")}</b>
                          </td>

                          <td>
                            ${available.toFixed(3)}
                          </td>

                          <td>
                            ${min.toFixed(3)}
                          </td>

                          <td>

                            <span class="
                              report-status
                              ${low
                                ? "report-status-low"
                                : "report-status-ok"}
                            ">
                              ${low
                                ? "Sắp hết hàng"
                                : "Đủ hàng"}
                            </span>

                          </td>

                        </tr>
                      `;

                    }).join("")

                  : `
                    <tr>
                      <td
                        colspan="5"
                        class="report-empty">
                        Chưa có dữ liệu tồn kho
                      </td>
                    </tr>
                  `
                }

              </tbody>

            </table>

          </div>

        </div>

      </div>
    `;


    // Vẽ biểu đồ sau khi HTML đã render
    requestAnimationFrame(() => {

      drawOrderChart(orderData);

      drawFoodChart(bestData);

      drawInventoryChart(inventoryData);

    });

  } catch (e) {

    document.getElementById("page").innerHTML = `
      <div class="alert">
        Không thể tải thống kê:
        ${esc(e.message)}
      </div>
    `;

  }
}


/* =========================================================
   BIỂU ĐỒ TRẠNG THÁI ĐƠN HÀNG
========================================================= */

function drawOrderChart(data) {

  const canvas =
    document.getElementById("orderChart");

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  const colors = [
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#64748b",
    "#ef4444"
  ];

  const labels = {

    PENDING:
      "Chờ xác nhận",

    CONFIRMED:
      "Đã xác nhận",

    PREPARING:
      "Đang chuẩn bị",

    READY:
      "Sẵn sàng nhận",

    COMPLETED:
      "Hoàn thành",

    CANCELLED:
      "Đã hủy"

  };

  const rows = data.filter(
    x => Number(x.count) > 0
  );

  const total = rows.reduce(
    (sum, x) =>
      sum + Number(x.count || 0),
    0
  );

  const w = canvas.clientWidth || 500;

  const h = 300;

  canvas.width =
    w * devicePixelRatio;

  canvas.height =
    h * devicePixelRatio;

  ctx.scale(
    devicePixelRatio,
    devicePixelRatio
  );


  if (!total) {

    ctx.fillStyle = "#94a3b8";

    ctx.font = "14px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
      "Chưa có dữ liệu đơn hàng",
      w / 2,
      150
    );

    return;
  }


  const centerX = w / 2;

  const centerY = 130;

  const radius = 92;

  let start =
    -Math.PI / 2;


  rows.forEach((x, index) => {

    const value =
      Number(x.count || 0);

    const angle =
      value / total *
      Math.PI * 2;


    ctx.beginPath();

    ctx.moveTo(
      centerX,
      centerY
    );

    ctx.arc(
      centerX,
      centerY,
      radius,
      start,
      start + angle
    );

    ctx.closePath();

    ctx.fillStyle =
      colors[index % colors.length];

    ctx.fill();


    start += angle;

  });


  // Vòng trắng ở giữa

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    56,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.fill();


  // Tổng số đơn

  ctx.fillStyle =
    "#172b4d";

  ctx.font =
    "bold 24px Arial";

  ctx.textAlign =
    "center";

  ctx.fillText(
    total,
    centerX,
    centerY - 2
  );


  ctx.font =
    "12px Arial";

  ctx.fillStyle =
    "#64748b";

  ctx.fillText(
    "Tổng đơn",
    centerX,
    centerY + 19
  );


  // Legend

  const legend =
    document.getElementById(
      "orderLegend"
    );

  if (legend) {

    legend.innerHTML =
      rows.map((x, index) => `
        <div class="report-legend-item">

          <span
            class="report-legend-color"
            style="
              background:
              ${colors[index % colors.length]}
            ">
          </span>

          ${esc(
            labels[x.status] ||
            x.status ||
            ""
          )}

          <b>
            ${Number(x.count || 0)}
          </b>

        </div>
      `).join("");

  }

}


/* =========================================================
   TOP MÓN BÁN CHẠY
========================================================= */

function drawFoodChart(data) {

  const container =
    document.getElementById(
      "foodRanking"
    );

  if (!container) return;


  const rows =
    data
      .filter(
        x => Number(x.quantity) > 0
      )
      .slice(0, 7);


  if (!rows.length) {

    container.innerHTML = `
      <div class="report-empty">
        Chưa có dữ liệu bán hàng
      </div>
    `;

    return;

  }


  const max =
    Math.max(
      ...rows.map(
        x => Number(x.quantity || 0)
      )
    );


  container.innerHTML =
    rows.map((x, index) => {

      const quantity =
        Number(x.quantity || 0);

      const percent =
        max > 0
          ? (quantity / max) * 100
          : 0;


      return `
        <div class="food-ranking-row">

          <div class="food-ranking-number">
            ${index + 1}
          </div>

          <div class="food-ranking-info">

            <div class="food-ranking-name">
              ${esc(x.name || "")}
            </div>

            <div class="food-ranking-track">

              <div
                class="food-ranking-bar"
                style="
                  width:${percent}%;
                ">
              </div>

            </div>

          </div>

          <div class="food-ranking-value">
            ${quantity}
          </div>

        </div>
      `;

    }).join("");

}


/* =========================================================
   BIỂU ĐỒ TỒN KHO
========================================================= */

function drawInventoryChart(data) {

  const canvas =
    document.getElementById(
      "inventoryChart"
    );

  if (!canvas) return;


  const ctx =
    canvas.getContext("2d");


  const rows =
    data.slice(0, 8);


  const w =
    canvas.clientWidth || 700;

  const h = 300;


  canvas.width =
    w * devicePixelRatio;

  canvas.height =
    h * devicePixelRatio;


  ctx.scale(
    devicePixelRatio,
    devicePixelRatio
  );


  if (!rows.length) {

    ctx.fillStyle =
      "#94a3b8";

    ctx.font =
      "14px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "Chưa có dữ liệu tồn kho",
      w / 2,
      150
    );

    return;

  }


  const left = 55;

  const right = 25;

  const top = 20;

  const bottom = 55;


  const chartWidth =
    w - left - right;

  const chartHeight =
    h - top - bottom;


  const max =
    Math.max(
      1,
      ...rows.flatMap(x => [
        Number(
          x.available_quantity || 0
        ),
        Number(
          x.min_quantity || 0
        )
      ])
    );


  // Trục ngang

  ctx.strokeStyle =
    "#e2e8f0";

  ctx.lineWidth = 1;


  for (
    let i = 0;
    i <= 4;
    i++
  ) {

    const y =
      top +
      chartHeight -
      (chartHeight / 4) * i;


    ctx.beginPath();

    ctx.moveTo(
      left,
      y
    );

    ctx.lineTo(
      w - right,
      y
    );

    ctx.stroke();


    ctx.fillStyle =
      "#94a3b8";

    ctx.font =
      "10px Arial";

    ctx.textAlign =
      "right";

    const value =
      max / 4 * i;

    ctx.fillText(
      value.toFixed(0),
      left - 7,
      y + 3
    );

  }


  const groupWidth =
    chartWidth / rows.length;


  const barWidth =
    Math.min(
      22,
      groupWidth * 0.25
    );


  rows.forEach(
    (x, index) => {

      const available =
        Number(
          x.available_quantity || 0
        );

      const minimum =
        Number(
          x.min_quantity || 0
        );


      const centerX =
        left +
        groupWidth * index +
        groupWidth / 2;


      const availableHeight =
        chartHeight *
        available /
        max;


      const minHeight =
        chartHeight *
        minimum /
        max;


      // Cột khả dụng

      ctx.fillStyle =
        "#16834a";

      ctx.fillRect(
        centerX - barWidth - 2,
        top +
          chartHeight -
          availableHeight,
        barWidth,
        availableHeight
      );


      // Cột tối thiểu

      ctx.fillStyle =
        "#f59e0b";

      ctx.fillRect(
        centerX + 2,
        top +
          chartHeight -
          minHeight,
        barWidth,
        minHeight
      );


      // Tên hàng

      ctx.fillStyle =
        "#475569";

      ctx.font =
        "11px Arial";

      ctx.textAlign =
        "center";


      let name =
        String(
          x.name || ""
        );


      if (name.length > 11) {

        name =
          name.slice(0, 9) +
          "...";

      }


      ctx.fillText(
        name,
        centerX,
        h - 25
      );

    }
  );


  const legend =
    document.getElementById(
      "inventoryLegend"
    );


  if (legend) {

    legend.innerHTML = `

      <div class="report-legend-item">

        <span
          class="report-legend-color"
          style="
            background:#16834a
          ">
        </span>

        Số lượng khả dụng

      </div>


      <div class="report-legend-item">

        <span
          class="report-legend-color"
          style="
            background:#f59e0b
          ">
        </span>

        Mức tồn tối thiểu

      </div>

    `;

  }

}