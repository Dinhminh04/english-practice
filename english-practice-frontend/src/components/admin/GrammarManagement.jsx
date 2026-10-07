import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Form,
  Table,
  Tabs,
  Tab,
  Card,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import GrammarExamplesAndPractices from "./GrammarExamplesAndPractices";
import Layout from "../layout/admin/Layout";

// Quản lý ngữ pháp: chủ đề và bài học
const GrammarManagement = ({ handleLogout }) => {
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [activeTab, setActiveTab] = useState("topics");

  const [currentTopicPage, setCurrentTopicPage] = useState(1);
  const [topicsPerPage] = useState(5);
  const [totalTopics, setTotalTopics] = useState(0);

  const [currentLessonPage, setCurrentLessonPage] = useState(1);
  const [lessonsPerPage] = useState(6);
  const [totalLessons, setTotalLessons] = useState(0);

  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    level: "beginner",
    display_order: 0,
  });

  const [lessonForm, setLessonForm] = useState({
    topic_id: "",
    title: "",
    explanation: "",
    structure: "",
    usage: "",
    tags: "",
    difficulty_level: "medium",
    display_order: 0,
  });

  // Tải danh sách chủ đề và bài học khi component được mount hoặc khi trang hiện tại thay đổi
  useEffect(() => {
    fetchTopics();
    fetchLessons();
  }, [currentTopicPage, currentLessonPage]);

  // Hàm tải danh sách chủ đề
  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/grammar/topics",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: currentTopicPage, limit: topicsPerPage },
        }
      );
      setTopics(response.data.topics);
      setTotalTopics(response.data.totalTopics);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách chủ đề");
    }
  };

  // Hàm tải danh sách bài học với bộ lọc
  const fetchLessons = async (filters = {}) => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.topic_id) params.append("topic_id", filters.topic_id);
      if (filters.level) params.append("level", filters.level);
      if (filters.difficulty) params.append("difficulty", filters.difficulty);
      params.append("page", currentLessonPage);
      params.append("limit", lessonsPerPage);

      const response = await axios.get(
        `http://localhost:5000/api/grammar/lessons?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLessons(response.data.lessons);
      setTotalLessons(response.data.totalLessons);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách bài học");
    }
  };

  // Hàm tải chi tiết bài học
  const fetchLessonDetail = async (lessonId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/grammar/lessons/${lessonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết bài học");
      return null;
    }
  };

  // Hàm xử lý submit form chủ đề
  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (editingTopic && editingTopic.id) {
        await axios.put(
          `http://localhost:5000/api/grammar/topics/${editingTopic.id}`,
          topicForm,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Chủ đề đã được cập nhật");
      } else {
        await axios.post(
          "http://localhost:5000/api/grammar/topics",
          topicForm,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Chủ đề đã được tạo");
      }

      setShowTopicModal(false);
      setEditingTopic(null);
      setTopicForm({
        title: "",
        description: "",
        level: "beginner",
        display_order: 0,
      });
      fetchTopics();
    } catch (error) {
      toast.error("Lỗi khi lưu chủ đề");
    }
  };

  // Hàm xử lý submit form bài học
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Append all text fields from state
      Object.keys(lessonForm).forEach((key) => {
        if (key === "tags") {
          // Convert tags string to array
          const tagsArray = lessonForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
          formData.append(key, JSON.stringify(tagsArray));
        } else if (
          key !== "id" &&
          key !== "created_at" &&
          key !== "updated_at"
        ) {
          formData.append(key, lessonForm[key]);
        }
      });

      if (editingLesson) {
        await axios.put(
          `http://localhost:5000/api/grammar/lessons/${editingLesson.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Bài học đã được cập nhật");
      } else {
        await axios.post(
          "http://localhost:5000/api/grammar/lessons",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Bài học đã được tạo");
      }

      setShowLessonModal(false);
      setEditingLesson(null);
      setLessonForm({
        topic_id: "",
        title: "",
        explanation: "",
        structure: "",
        usage: "",
        tags: "",
        difficulty_level: "medium",
        display_order: 0,
      });
      fetchLessons();
    } catch (error) {
      console.error(error.response || error);
      toast.error(
        editingLesson ? "Lỗi khi cập nhật bài học" : "Lỗi khi tạo bài học"
      );
    }
  };

  // Xóa chủ đề
  const deleteTopic = (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Bạn sẽ không thể khôi phục lại chủ đề này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Vâng, xóa nó đi!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`http://localhost:5000/api/grammar/topics/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire("Đã xóa!", "Chủ đề của bạn đã được xóa.", "success");
          fetchTopics();
        } catch (error) {
          Swal.fire("Lỗi!", "Có lỗi xảy ra khi xóa chủ đề.", "error");
        }
      }
    });
  };

  // Xóa bài học
  const deleteLesson = (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Bạn sẽ không thể khôi phục lại bài học này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Vâng, xóa nó đi!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(
            `http://localhost:5000/api/grammar/lessons/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          Swal.fire("Đã xóa!", "Bài học của bạn đã được xóa.", "success");
          fetchLessons();
        } catch (error) {
          Swal.fire("Lỗi!", "Có lỗi xảy ra khi xóa bài học.", "error");
        }
      }
    });
  };

  // Mở modal chủ đề, nếu có truyền chủ đề thì là sửa
  const openTopicModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        title: topic.title,
        description: topic.description,
        level: topic.level,
        display_order: topic.display_order,
      });
    } else {
      setEditingTopic(null);
      setTopicForm({
        title: "",
        description: "",
        level: "beginner",
        display_order: 0,
      });
    }
    setShowTopicModal(true);
  };

  // Mở modal bài học, nếu có truyền bài học thì là sửa
  const openLessonModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        topic_id: lesson.topic_id,
        title: lesson.title,
        explanation: lesson.explanation,
        structure: lesson.structure || "",
        usage: lesson.usage || "",
        tags: Array.isArray(lesson.tags)
          ? lesson.tags.join(", ")
          : lesson.tags || "",
        difficulty_level: lesson.difficulty_level,
        display_order: lesson.display_order,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        topic_id: currentTopic?.id || "",
        title: "",
        explanation: "",
        structure: "",
        usage: "",
        tags: "",
        difficulty_level: "medium",
        display_order: lessons.length + 1,
      });
    }
    setShowLessonModal(true);
  };

  // Xử lý lọc bài học theo chủ đề
  const handleTopicFilter = (topicId) => {
    setCurrentTopic(topicId ? topics.find((t) => t.id === topicId) : null);
    if (activeTab === "lessons") {
      fetchLessons(topicId ? { topic_id: topicId } : {});
    }
  };

  // Hàm lấy màu badge theo level
  const getLevelBadgeVariant = (level) => {
    switch (level) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "danger";
      default:
        return "secondary";
    }
  };

  //  Hàm lấy màu badge theo độ khó
  const getDifficultyBadgeVariant = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "secondary";
    }
  };

  const filteredTopics = currentTopic
    ? topics.filter((t) => t.id === currentTopic.id)
    : topics;

  return (
    <Layout handleLogout={handleLogout}>
      <div className="page-inner">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <h2 className="mb-3 mb-md-0 fw-bold text-primary">
            Quản lý Ngữ pháp
          </h2>

          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-primary" onClick={() => openTopicModal()}>
              <i className="bi bi-folder-plus me-1"></i>
              Tạo Chủ đề Mới
            </Button>

            <Button
              variant="primary"
              onClick={() => openLessonModal()}
              disabled={!currentTopic && topics.length > 0}
            >
              <i className="bi bi-file-earmark-plus me-1"></i>
              Tạo Bài học Mới
            </Button>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onSelect={(tab) => setActiveTab(tab)}
          id="grammar-management-tabs"
          className="mb-4"
        >
          <Tab eventKey="topics" title="Chủ đề Ngữ pháp">
            <Row>
              <Col md={12}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Lọc theo Chủ đề</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group>
                      <Form.Label>Chọn chủ đề:</Form.Label>
                      <Form.Select
                        className="w-50"
                        value={currentTopic?.id || ""}
                        onChange={(e) =>
                          handleTopicFilter(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      >
                        <option value="">Tất cả chủ đề</option>
                        {topics.map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.title} ({topic.level})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={12}>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Level</th>
                      <th>Mô tả</th>
                      <th>Thứ tự</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          Chưa có chủ đề nào.
                        </td>
                      </tr>
                    ) : (
                      filteredTopics.map((topic) => (
                        <tr key={topic.id}>
                          <td>
                            <strong>{topic.title}</strong>
                          </td>
                          <td>
                            <Badge bg={getLevelBadgeVariant(topic.level)}>
                              {topic.level}
                            </Badge>
                          </td>
                          <td>{topic.description}</td>
                          <td>{topic.display_order}</td>
                          <td>
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="me-2"
                              onClick={() => openTopicModal(topic)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => {
                                handleTopicFilter(topic.id);
                                setActiveTab("lessons");
                              }}
                            >
                              Xem Bài học
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => deleteTopic(topic.id)}
                            >
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
                <div className="d-flex justify-content-end">
                  <Button
                    variant="outline-primary"
                    disabled={currentTopicPage === 1}
                    onClick={() => setCurrentTopicPage(currentTopicPage - 1)}
                    className="me-2"
                  >
                    Trước
                  </Button>
                  <span className="align-self-center">
                    Trang {currentTopicPage} /{" "}
                    {Math.ceil(totalTopics / topicsPerPage)}
                  </span>
                  <Button
                    variant="outline-primary"
                    disabled={
                      currentTopicPage ===
                      Math.ceil(totalTopics / topicsPerPage)
                    }
                    onClick={() => setCurrentTopicPage(currentTopicPage + 1)}
                    className="ms-2"
                  >
                    Sau
                  </Button>
                </div>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="lessons" title="Bài học Ngữ pháp">
            <div className="mb-3">
              {currentTopic && (
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Bài học trong: {currentTopic.title}</h5>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleTopicFilter(null)}
                  >
                    Xem tất cả bài học
                  </Button>
                </div>
              )}
            </div>

            <Row>
              {lessons.map((lesson) => (
                <Col md={6} lg={4} key={lesson.id} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="h6">{lesson.title}</Card.Title>
                        <Badge
                          bg={getDifficultyBadgeVariant(
                            lesson.difficulty_level
                          )}
                        >
                          {lesson.difficulty_level}
                        </Badge>
                      </div>

                      <p className="text-muted small mb-2">
                        {lesson.topic_title}
                      </p>

                      <p className="small">
                        {lesson.explanation.length > 100
                          ? `${lesson.explanation.substring(0, 100)}...`
                          : lesson.explanation}
                      </p>

                      {lesson.tags && lesson.tags.length > 0 && (
                        <div className="mb-2">
                          {JSON.parse(lesson.tags)
                            .slice(0, 3)
                            .map((tag, index) => (
                              <Badge
                                key={index}
                                bg="light"
                                text="dark"
                                className="me-1 small"
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer>
                      <div className="d-flex justify-content-end">
                        <Button
                          className="me-2"
                          variant="outline-info"
                          size="sm"
                          onClick={() => openLessonModal(lesson)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteLesson(lesson.id)}
                        >
                          Xóa
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-2"
                          onClick={() => {
                            setCurrentLesson(lesson);
                            setActiveTab("examples-practices");
                          }}
                        >
                          Ví dụ & Bài tập
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>

            {lessons.length > 0 && (
              <div className="d-flex justify-content-end mt-3">
                <Button
                  variant="outline-primary"
                  disabled={currentLessonPage === 1}
                  onClick={() => setCurrentLessonPage(currentLessonPage - 1)}
                  className="me-2"
                >
                  Trước
                </Button>
                <span className="align-self-center">
                  Trang {currentLessonPage} /{" "}
                  {Math.ceil(totalLessons / lessonsPerPage)}
                </span>
                <Button
                  variant="outline-primary"
                  disabled={
                    currentLessonPage ===
                    Math.ceil(totalLessons / lessonsPerPage)
                  }
                  onClick={() => setCurrentLessonPage(currentLessonPage + 1)}
                  className="ms-2"
                >
                  Sau
                </Button>
              </div>
            )}

            {lessons.length === 0 && (
              <div className="text-center py-5">
                <p>Chưa có bài học nào.</p>
                <Button
                  variant="primary"
                  onClick={() => openLessonModal()}
                  disabled={!currentTopic && topics.length > 0}
                >
                  Tạo Bài học Đầu tiên
                </Button>
              </div>
            )}
          </Tab>
          <Tab eventKey="examples-practices" title="Ví dụ & Bài tập">
            <GrammarExamplesAndPractices
              lessonId={currentLesson?.id}
              lessonTitle={currentLesson?.title}
            />{" "}
          </Tab>
        </Tabs>
        {/* Modal chủ đề */}
        <Modal show={showTopicModal} onHide={() => setShowTopicModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingTopic ? "Sửa Chủ đề" : "Tạo Chủ đề Mới"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleTopicSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Tiêu đề</Form.Label>
                <Form.Control
                  type="text"
                  value={topicForm.title}
                  onChange={(e) =>
                    setTopicForm({ ...topicForm, title: e.target.value })
                  }
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={topicForm.description}
                  onChange={(e) =>
                    setTopicForm({ ...topicForm, description: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Level</Form.Label>
                <Form.Select
                  value={topicForm.level}
                  onChange={(e) =>
                    setTopicForm({ ...topicForm, level: e.target.value })
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Thứ tự hiển thị</Form.Label>
                <Form.Control
                  type="number"
                  value={topicForm.display_order}
                  onChange={(e) =>
                    setTopicForm({
                      ...topicForm,
                      display_order: parseInt(e.target.value),
                    })
                  }
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowTopicModal(false)}
              >
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                {editingTopic ? "Cập nhật" : "Tạo"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
        {/* Modal bài học */}
        <Modal
          show={showLessonModal}
          onHide={() => setShowLessonModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingLesson ? "Sửa Bài học" : "Tạo Bài học Mới"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleLessonSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Chủ đề</Form.Label>
                <Form.Select
                  value={lessonForm.topic_id}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      topic_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Chọn chủ đề</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title} ({topic.level})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Tiêu đề bài học</Form.Label>
                <Form.Control
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Giải thích ngữ pháp</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={lessonForm.explanation}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      explanation: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cấu trúc</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={lessonForm.structure}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          structure: e.target.value,
                        })
                      }
                      placeholder="Ví dụ: Subject + have/has + past participle"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cách sử dụng</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={lessonForm.usage}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          usage: e.target.value,
                        })
                      }
                      placeholder="Ví dụ: Diễn tả hành động đã xảy ra trong quá khứ..."
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Tags (phân cách bằng dấu phẩy)</Form.Label>
                <Form.Control
                  type="text"
                  value={lessonForm.tags}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      tags: e.target.value,
                    })
                  }
                  placeholder="present perfect, experience, result"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Độ khó</Form.Label>
                    <Form.Select
                      value={lessonForm.difficulty_level}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          difficulty_level: e.target.value,
                        })
                      }
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Thứ tự hiển thị</Form.Label>
                    <Form.Control
                      type="number"
                      value={lessonForm.display_order}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          display_order: parseInt(e.target.value),
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowLessonModal(false)}
              >
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                {editingLesson ? "Cập nhật" : "Tạo Bài học"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default GrammarManagement;
