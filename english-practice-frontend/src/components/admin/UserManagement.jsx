import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Table, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Layout from "../layout/admin/Layout";

const MySwal = withReactContent(Swal);
// Quản lý người dùng
const UserManagement = ({ handleLogout }) => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [isVerified, setIsVerified] = useState("");

  const [userForm, setUserForm] = useState({
    email: "",
    phone: "",
    password: "",
    display_name: "",
    role: "user",
    is_premium: false,
  });
  // Tải danh sách người dùng
  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, role, isVerified]);

  // Hàm tải người dùng từ API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 10, search, role, is_verified: isVerified },
      });
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setTotalUsers(response.data.pagination.totalUsers);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
    }
  };

  // Hàm xử lý submit form tạo/sửa người dùng
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/admin/users/${editingUser.id}`, userForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Người dùng đã được cập nhật");
      } else {
        await axios.post("http://localhost:5000/api/admin/users", userForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Người dùng đã được tạo");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Lỗi khi lưu người dùng");
      }
    }
  };

  // Xóa người dùng
  const deleteUser = async (user) => {
    if (user.role === 'superadmin') {
      toast.error('Không thể xóa superadmin');
      return;
    }
    MySwal.fire({
      title: "Bạn có chắc chắn?",
      text: "Bạn sẽ không thể khôi phục lại điều này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Vâng, xóa nó!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`http://localhost:5000/api/admin/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Người dùng đã được xóa");
          fetchUsers();
        } catch (error) {
          toast.error("Lỗi khi xóa người dùng");
        }
      }
    });
  };

  // Chuyển đổi trạng thái premium
  const togglePremiumStatus = async (user) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:5000/api/admin/users/${user.id}/premium`, { isPremium: !user.is_premium }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Trạng thái premium đã được cập nhật");
      fetchUsers();
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái premium");
    }
  };

  // Mở modal tạo/sửa người dùng
  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm(user);
    setShowModal(true);
  };

  // Mở modal tạo người dùng mới
  const openCreateModal = () => {
    setEditingUser(null);
    setUserForm({
      email: "",
      phone: "",
      password: "",
      display_name: "",
      role: "user",
      is_premium: false,
    });
    setShowModal(true);
  };

  // Mở modal chi tiết người dùng
  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  return (
    <Layout>
      <div className="page-inner">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-3 mb-md-0 fw-bold text-primary">Quản lý Người dùng</h2>
          <Button variant="primary" onClick={openCreateModal}>
            Tạo Người dùng Mới
          </Button>
        </div>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Tất cả vai trò</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select value={isVerified} onChange={(e) => setIsVerified(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đã xác thực</option>
              <option value="false">Chưa xác thực</option>
            </Form.Select>
          </Col>
        </Row>

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Email</th>
              <th>Tên hiển thị</th>
              <th>Vai trò</th>
              <th>Premium</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.display_name}</td>
                <td>{user.role}</td>
                <td>
                  <Button
                    variant={user.is_premium ? "success" : "secondary"}
                    size="sm"
                    onClick={() => togglePremiumStatus(user)}
                  >
                    {user.is_premium ? "Premium" : "Thường"}
                  </Button>
                </td>
                <td>{user.is_verified ? "Đã xác thực" : "Chưa xác thực"}</td>
                <td>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() => openDetailsModal(user)}
                  >
                    Xem
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => openEditModal(user)}
                    disabled={user.role === 'superadmin'}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => deleteUser(user)}
                    disabled={user.role === 'superadmin'}
                  >
                    Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="d-flex justify-content-end">
          <Button
            variant="outline-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="me-2"
          >
            Trước
          </Button>
          <span className="align-self-center">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline-primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="ms-2"
          >
            Sau
          </Button>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingUser ? "Sửa Người dùng" : "Tạo Người dùng Mới"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleFormSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tên hiển thị</Form.Label>
                <Form.Control
                  type="text"
                  value={userForm.display_name}
                  onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </Form.Group>
              {!editingUser && (
                <Form.Group className="mb-3">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Premium User"
                  checked={userForm.is_premium}
                  onChange={(e) => setUserForm({ ...userForm, is_premium: e.target.checked })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                {editingUser ? "Cập nhật" : "Tạo"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết người dùng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser && (
              <div>
                <p><strong>ID:</strong> {selectedUser.id}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Tên hiển thị:</strong> {selectedUser.display_name}</p>
                <p><strong>Số điện thoại:</strong> {selectedUser.phone}</p>
                <p><strong>Vai trò:</strong> {selectedUser.role}</p>
                <p><strong>Premium:</strong> {selectedUser.is_premium ? 'Có' : 'Không'}</p>
                <p><strong>Đã xác thực:</strong> {selectedUser.is_verified ? 'Rồi' : 'Chưa'}</p>
                <p><strong>Ngày tạo:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
                <p><strong>Cập nhật lần cuối:</strong> {new Date(selectedUser.updated_at).toLocaleString()}</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
};

export default UserManagement;
