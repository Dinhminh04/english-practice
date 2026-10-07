// GrammarExamplesAndPractices.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Form,
  Table,
  Card,
  Row,
  Col,
  Badge,
  Tab,
  Tabs,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Layout from "../layout/admin/Layout";

// Component quản lý ví dụ và bài tập ngữ pháp cho một bài học cụ thể
const GrammarExamplesAndPractices = ({ lessonId, lessonTitle }) => {
  const [examples, setExamples] = useState([]);
  const [practices, setPractices] = useState([]);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showPracticeDetailModal, setShowPracticeDetailModal] = useState(false);
  const [editingExample, setEditingExample] = useState(null);
  const [editingPractice, setEditingPractice] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [activeTab, setActiveTab] = useState("examples");

  const [exampleForm, setExampleForm] = useState({
    example_sentence: "",
    meaning: "",
    notes: "",
    display_order: 0,
  });

  const [practiceForm, setPracticeForm] = useState({
    title: "",
    instructions: "",
    content: { questions: [] },
    practice_type: "multiple_choice",
    difficulty_level: "medium",
    time_limit: 10,
    points: 10,
    display_order: 0,
  });

  // Tải ví dụ và bài tập khi lessonId thay đổi
  useEffect(() => {
    if (lessonId) {
      fetchExamples();
      fetchPractices();
    }
  }, [lessonId]);

  // Hàm tải ví dụ từ API
  const fetchExamples = async () => {
    console.log("Fetching examples for lessonId:", lessonId);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/grammar/examples?lesson_id=${lessonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("API response for examples:", response.data);
      setExamples(response.data);
    } catch (error) {
      console.error("Error fetching examples:", error.response || error);
      toast.error("Lỗi khi tải danh sách ví dụ");
    }
  };

  // Hàm tải bài tập từ API
  const fetchPractices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/grammar/practices?lesson_id=${lessonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPractices(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách bài thực hành");
    }
  };

  // Xử lý gửi form ví dụ
  const handleExampleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("lesson_id", lessonId);
      Object.keys(exampleForm).forEach((key) => {
        formData.append(key, exampleForm[key]);
      });

      if (editingExample) {
        await axios.put(
          `http://localhost:5000/api/grammar/examples/${editingExample.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Ví dụ đã được cập nhật");
      } else {
        await axios.post(
          "http://localhost:5000/api/grammar/examples",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Ví dụ đã được thêm");
      }

      setShowExampleModal(false);
      setEditingExample(null);
      setExampleForm({
        example_sentence: "",
        meaning: "",
        notes: "",
        display_order: 0,
      });
      fetchExamples();
    } catch (error) {
      toast.error("Lỗi khi lưu ví dụ");
    }
  };

  // Xử lý gửi form bài tập
  const handlePracticeSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Create a deep copy to avoid modifying state directly
      const practiceData = JSON.parse(JSON.stringify(practiceForm));

      // The content field needs to be a JSON string
      practiceData.content = JSON.stringify(practiceData.content);
      practiceData.lesson_id = lessonId;

      if (editingPractice) {
        await axios.put(
          `http://localhost:5000/api/grammar/practices/${editingPractice.id}`,
          practiceData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Bài thực hành đã được cập nhật");
      } else {
        await axios.post(
          "http://localhost:5000/api/grammar/practices",
          practiceData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Bài thực hành đã được thêm");
      }

      setShowPracticeModal(false);
      setEditingPractice(null);
      // Reset form state
      setPracticeForm({
        title: "",
        instructions: "",
        content: { questions: [] },
        practice_type: "multiple_choice",
        difficulty_level: "medium",
        time_limit: 10,
        points: 10,
        display_order: 0,
      });
      fetchPractices();
    } catch (error) {
      console.error("Practice submit error:", error.response || error);
      toast.error("Lỗi khi lưu bài thực hành");
    }
  };

  // Hàm xử lý thay đổi trong câu hỏi
  const handleQuestionChange = (qIndex, field, value) => {
    const newQuestions = [...practiceForm.content.questions];
    newQuestions[qIndex][field] = value;
    if (field === "question_type") {
      newQuestions[qIndex].options = [];
      newQuestions[qIndex].correctAnswer = "";
    }
    setPracticeForm({
      ...practiceForm,
      content: { ...practiceForm.content, questions: newQuestions },
    });
  };

  // Hàm xử lý thay đổi trong tài liệu
  const handleQuestionAdd = () => {
    const newQuestions = [
      ...practiceForm.content.questions,
      {
        question_type: "multiple_choice",
        question_text: "",
        options: [],
        correctAnswer: "",
      },
    ];
    setPracticeForm({
      ...practiceForm,
      content: { ...practiceForm.content, questions: newQuestions },
    });
  };

  // Hàm xóa câu hỏi
  const handleQuestionDelete = (qIndex) => {
    const newQuestions = [...practiceForm.content.questions];
    newQuestions.splice(qIndex, 1);
    setPracticeForm({
      ...practiceForm,
      content: { ...practiceForm.content, questions: newQuestions },
    });
  };

  // Hàm xử lý thay đổi trong các lựa chọn của câu hỏi trắc nghiệm
  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = [...practiceForm.content.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setPracticeForm({
      ...practiceForm,
      content: { ...practiceForm.content, questions: newQuestions },
    });
  };

  // Hàm thêm lựa chọn mới cho câu hỏi trắc nghiệm
  const handleOptionAdd = (qIndex) => {
    const newQuestions = [...practiceForm.content.questions];
    newQuestions[qIndex].options.push("");
    setPracticeForm({
      ...practiceForm,
      content: { ...practiceForm.content, questions: newQuestions },
    });
  };

  // Hàm xóa lựa chọn khỏi câu hỏi trắc nghiệm
  const handleOptionDelete = (qIndex, optIndex) => {
    const newQuestions = [...practiceForm.content.questions];
    newQuestions[qIndex].options.splice(optIndex, 1);
    setPracticeForm({
      ...practiceForm,
      content: { ...practiceForm.content, questions: newQuestions },
    });
  };

  // Mở modal ví dụ, nếu có truyền ví dụ thì là sửa
  const openExampleModal = (example = null) => {
    if (example) {
      setEditingExample(example);
      setExampleForm({
        example_sentence: example.example_sentence,
        meaning: example.meaning || "",
        notes: example.notes || "",
        display_order: example.display_order,
      });
    } else {
      setEditingExample(null);
      setExampleForm({
        example_sentence: "",
        meaning: "",
        notes: "",
        display_order: examples.length + 1,
      });
    }
    setShowExampleModal(true);
  };

  // Mở modal bài tập, nếu có truyền bài tập thì là sửa
  const openPracticeModal = (practice = null) => {
    if (practice) {
      setEditingPractice(practice);
      let practiceContent = { questions: [] };
      try {
        // content from DB is a JSON string
        if (practice.content && typeof practice.content === "string") {
          practiceContent = JSON.parse(practice.content);
        }
      } catch (error) {
        console.error("Error parsing practice content:", error);
        toast.error("Lỗi khi đọc dữ liệu câu hỏi của bài thực hành.");
      }
      setPracticeForm({
        title: practice.title,
        instructions: practice.instructions,
        content: practiceContent, // Use parsed content
        practice_type: practice.practice_type,
        difficulty_level: practice.difficulty_level,
        time_limit: practice.time_limit,
        points: practice.points,
        display_order: practice.display_order,
      });
    } else {
      setEditingPractice(null);
      setPracticeForm({
        title: "",
        instructions: "",
        content: { questions: [] }, // Initialize with empty questions array
        practice_type: "multiple_choice",
        difficulty_level: "medium",
        time_limit: 10,
        points: 10,
        display_order: practices.length + 1,
      });
    }
    setShowPracticeModal(true);
  };

  if (!lessonId) {
    return (
      <Card>
        <Card.Body className="text-center">
          <p>Vui lòng chọn một bài học để quản lý ví dụ và bài tập</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="page-inner">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h4 className="fw-bold text-secondary mb-3 mb-md-0">
          Quản lý Ví dụ & Bài tập
          <span className="text-primary"> – {lessonTitle}</span>
        </h4>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-primary" onClick={() => openExampleModal()}>
            <i className="bi bi-plus-circle me-1"></i>
            Thêm Ví dụ
          </Button>

          <Button variant="primary" onClick={() => openPracticeModal()}>
            <i className="bi bi-journal-text me-1"></i>
            Thêm Bài tập
          </Button>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="mb-4"
      >
        <Tab eventKey="examples" title="Ví dụ minh họa">
          <Row>
            {examples.map((example) => (
              <Col md={6} key={example.id} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title className="h6">
                      {example.example_sentence}
                    </Card.Title>
                    {example.meaning && (
                      <p className="text-muted">
                        {example.meaning}
                      </p>
                    )}
                    {example.notes && (
                      <p className="small">
                        <strong>Ghi chú:</strong> {example.notes}
                      </p>
                    )}
                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => openExampleModal(example)}
                      >
                        Sửa
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {examples.length === 0 && (
            <div className="text-center py-5">
              <p>Chưa có ví dụ nào cho bài học này.</p>
              <Button variant="primary" onClick={() => openExampleModal()}>
                Thêm Ví dụ Đầu tiên
              </Button>
            </div>
          )}
        </Tab>

        <Tab eventKey="practices" title="Bài tập ngữ pháp">
          <Row>
            {practices.map((practice) => (
              <Col md={6} lg={4} key={practice.id} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h6">{practice.title}</Card.Title>
                      <Badge bg="info">{practice.practice_type}</Badge>
                    </div>
                    <p className="small">
                      {practice.instructions}
                    </p>
                    <div className="mt-auto">
                      <Badge bg="secondary" className="me-2">
                        {practice.points} điểm
                      </Badge>
                      <Badge bg="warning" text="dark">
                        {practice.time_limit} phút
                      </Badge>
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => openPracticeModal(practice)}
                      >
                        Sửa
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>

          {practices.length === 0 && (
            <div className="text-center py-5">
              <p>Chưa có bài thực hành nào cho bài học này.</p>
              <Button variant="primary" onClick={() => openPracticeModal()}>
                Thêm Bài tập Đầu tiên
              </Button>
            </div>
          )}
        </Tab>
      </Tabs>

      {/* Modal ví dụ */}
      <Modal show={showExampleModal} onHide={() => setShowExampleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingExample ? "Sửa Ví dụ" : "Thêm Ví dụ Mới"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleExampleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Câu ví dụ</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={exampleForm.example_sentence}
                onChange={(e) =>
                  setExampleForm({
                    ...exampleForm,
                    example_sentence: e.target.value,
                  })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nghĩa</Form.Label>
              <Form.Control
                type="text"
                value={exampleForm.meaning}
                onChange={(e) =>
                  setExampleForm({
                    ...exampleForm,
                    meaning: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={exampleForm.notes}
                onChange={(e) =>
                  setExampleForm({
                    ...exampleForm,
                    notes: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thứ tự hiển thị</Form.Label>
              <Form.Control
                type="number"
                value={exampleForm.display_order}
                onChange={(e) =>
                  setExampleForm({
                    ...exampleForm,
                    display_order: parseInt(e.target.value),
                  })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowExampleModal(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingExample ? "Cập nhật" : "Thêm"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal bài thực hành */}
      <Modal
        show={showPracticeModal}
        onHide={() => setShowPracticeModal(false)}
        size="lg"
      >
        <Form onSubmit={handlePracticeSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingPractice ? "Sửa Bài thực hành" : "Thêm Bài thực hành Mới"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Practice Metadata Form */}
            <Form.Group className="mb-3">
              <Form.Label>Tiêu đề</Form.Label>
              <Form.Control
                type="text"
                value={practiceForm.title}
                onChange={(e) =>
                  setPracticeForm({ ...practiceForm, title: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hướng dẫn</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={practiceForm.instructions}
                onChange={(e) =>
                  setPracticeForm({
                    ...practiceForm,
                    instructions: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại bài tập</Form.Label>
                  <Form.Select
                    value={practiceForm.practice_type}
                    onChange={(e) =>
                      setPracticeForm({
                        ...practiceForm,
                        practice_type: e.target.value,
                      })
                    }
                  >
                    <option value="multiple_choice">Trắc nghiệm</option>
                    <option value="fill_in_blank">Điền vào chỗ trống</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Độ khó</Form.Label>
                  <Form.Select
                    value={practiceForm.difficulty_level}
                    onChange={(e) =>
                      setPracticeForm({
                        ...practiceForm,
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
            </Row>

            {/* Dynamic Questions Form */}
            <hr />
            <h5>Câu hỏi</h5>
            {practiceForm.content.questions.map((q, qIndex) => (
              <Card key={qIndex} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <strong>Câu hỏi {qIndex + 1}</strong>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleQuestionDelete(qIndex)}
                    >
                      Xóa câu hỏi
                    </Button>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Loại câu hỏi</Form.Label>
                    <Form.Select
                      value={q.question_type}
                      onChange={(e) =>
                        handleQuestionChange(
                          qIndex,
                          "question_type",
                          e.target.value
                        )
                      }
                    >
                      <option value="multiple_choice">Trắc nghiệm</option>
                      <option value="fill_in_blank">Điền vào chỗ trống</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Nội dung câu hỏi</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={q.question_text}
                      onChange={(e) =>
                        handleQuestionChange(
                          qIndex,
                          "question_text",
                          e.target.value
                        )
                      }
                      placeholder="Ví dụ: The sun ___ in the east."
                    />
                  </Form.Group>

                  {q.question_type === "multiple_choice" && (
                    <div>
                      <strong>Các lựa chọn</strong>
                      {q.options.map((opt, optIndex) => (
                        <InputGroup key={optIndex} className="mb-2">
                          <InputGroup.Text>
                            <Form.Check
                              type="radio"
                              name={`correctAnswer-${qIndex}`}
                              id={`correctAnswer-${qIndex}-${optIndex}`}
                              checked={q.correctAnswer === optIndex.toString()}
                              onChange={() =>
                                handleQuestionChange(
                                  qIndex,
                                  "correctAnswer",
                                  optIndex.toString()
                                )
                              }
                            />
                          </InputGroup.Text>
                          <Form.Control
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(
                                qIndex,
                                optIndex,
                                e.target.value
                              )
                            }
                          />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleOptionDelete(qIndex, optIndex)}
                          >
                            Xóa
                          </Button>
                        </InputGroup>
                      ))}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOptionAdd(qIndex)}
                      >
                        Thêm lựa chọn
                      </Button>
                    </div>
                  )}

                  {q.question_type === "fill_in_blank" && (
                    <Form.Group className="mb-3">
                      <Form.Label>Đáp án đúng</Form.Label>
                      <Form.Control
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "correctAnswer",
                            e.target.value
                          )
                        }
                      />
                    </Form.Group>
                  )}
                </Card.Body>
              </Card>
            ))}
            <Button variant="primary" onClick={handleQuestionAdd}>
              Thêm câu hỏi
            </Button>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowPracticeModal(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingPractice ? "Cập nhật" : "Thêm"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default GrammarExamplesAndPractices;
