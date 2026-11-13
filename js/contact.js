
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const messageBox = document.getElementById("contactFormMessage");
  const submitButton = form.querySelector('[type="submit"]');

  function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `contact-form-message ${type}`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("", "");

    const formData = new FormData(form);

    const data = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      type: String(formData.get("type") || ""),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };

    // Kiểm tra dữ liệu trước khi gửi
    if (!data.name || !data.email || !data.message) {
      showMessage("Vui lòng nhập đầy đủ họ tên, email và nội dung.", "error");
      return;
    }

    if (!["contact", "feedback"].includes(data.type)) {
      showMessage("Loại yêu cầu không hợp lệ.", "error");
      return;
    }

    if (data.name.length > 100 ||
        data.email.length > 150 ||
        data.phone.length > 15 ||
        data.subject.length > 150 ||
        data.message.length > 5000) {
      showMessage("Một số thông tin vượt quá độ dài cho phép.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showMessage("Vui lòng nhập địa chỉ email hợp lệ.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Đang gửi...";

    try {
      const response = await fetch("http://localhost:3000/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gửi liên hệ không thành công.");
      }

      showMessage(
        "CenDeli đã nhận được yêu cầu của bạn. Cảm ơn bạn đã liên hệ!",
        "success"
      );

      form.reset();
    } catch (error) {
      console.error("Lỗi gửi liên hệ:", error);

      showMessage(
        error.message || "Không thể kết nối máy chủ. Vui lòng thử lại.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Gửi liên hệ";
    }
  });
});
