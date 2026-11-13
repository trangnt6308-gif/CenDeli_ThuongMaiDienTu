
const API_URL = "http://localhost:3000/api/reviews";

// Lấy ID sản phẩm từ URL: chi-tiet-san-pham.html?id=1
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const reviewRoot = document.getElementById("reviews-root");

// Lấy token đăng nhập từ localStorage.
// Khi tích hợp đăng nhập Backend, cần lưu JWT vào một trong các key này.
function getToken() {
    return (
        localStorage.getItem("cendeli_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken")
    );
}

// Chuyển ký tự đặc biệt thành HTML an toàn
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return entities[char];
    });
}

// Hiển thị sao đánh giá
function renderStars(rating) {
    const score = Number(rating) || 0;

    return `
        <span class="review-stars" aria-label="${score} trên 5 sao">
            ${"★".repeat(score)}${"☆".repeat(5 - score)}
        </span>
    `;
}

// Định dạng ngày
function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN");
}

// Tạo giao diện
function renderReviewLayout() {
    if (!reviewRoot) return;

    reviewRoot.innerHTML = `
        <div class="reviews-container">
            <h2>Đánh giá sản phẩm</h2>

            <div class="review-summary" id="review-summary">
                Đang tải đánh giá...
            </div>

            <div class="review-form-container">
                <h3>Viết đánh giá của bạn</h3>

                <form id="review-form">
                    <div class="review-rating-input">
                        <label>Chọn số sao:</label>

                        <div class="star-selector">
                            ${[1, 2, 3, 4, 5].map(star => `
                                <button
                                    type="button"
                                    class="star-btn"
                                    data-rating="${star}"
                                    aria-label="${star} sao"
                                >★</button>
                            `).join("")}
                        </div>

                        <input
                            type="hidden"
                            id="review-rating"
                            value="5"
                        >
                    </div>

                    <div class="review-content-input">
                        <label for="review-content">
                            Nội dung đánh giá:
                        </label>

                        <textarea
                            id="review-content"
                            maxlength="2000"
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                            required
                        ></textarea>
                    </div>

                    <button type="submit" id="submit-review">
                        Gửi đánh giá
                    </button>

                    <p id="review-message" role="status"></p>
                </form>
            </div>

            <div class="review-list-container">
                <h3>Khách hàng đánh giá</h3>
                <div id="review-list">Đang tải...</div>
            </div>
        </div>
    `;

    setupStarSelector();
    setupReviewForm();
}

// Chọn số sao
function setupStarSelector() {
    const starButtons = document.querySelectorAll(".star-btn");
    const ratingInput = document.getElementById("review-rating");

    function updateStars(rating) {
        starButtons.forEach(button => {
            const value = Number(button.dataset.rating);

            button.classList.toggle("selected", value <= rating);
        });
    }

    starButtons.forEach(button => {
        button.addEventListener("click", function () {
            const rating = Number(this.dataset.rating);

            ratingInput.value = rating;
            updateStars(rating);
        });
    });

    updateStars(5);
}

// Lấy danh sách đánh giá từ Backend
async function loadReviews() {
    if (!productId || !reviewRoot) return;

    const summaryElement = document.getElementById("review-summary");
    const listElement = document.getElementById("review-list");

    try {
        const response = await fetch(
            `${API_URL}/product/${encodeURIComponent(productId)}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Không thể tải đánh giá.");
        }

        // Hỗ trợ các dạng dữ liệu API thường dùng
        const reviews = Array.isArray(result.reviews)
            ? result.reviews
            : Array.isArray(result.data)
                ? result.data
                : [];

        const summary = result.summary || {};

        const total = Number(
            summary.total ?? summary.totalReviews ?? reviews.length
        );

        const average = Number(
            summary.average ?? summary.averageRating ?? 0
        );

        summaryElement.innerHTML = `
            <div class="review-average">
                <strong>${average.toFixed(1)}/5</strong>
                ${renderStars(Math.round(average))}
                <span>${total} lượt đánh giá</span>
            </div>
        `;

        renderReviewList(reviews, listElement);

    } catch (error) {
        console.error("Lỗi tải đánh giá:", error);

        summaryElement.textContent = "Chưa thể tải thông tin đánh giá.";

        listElement.textContent =
            "Không thể tải danh sách đánh giá. Vui lòng thử lại sau.";
    }
}

// Hiển thị danh sách đánh giá và phản hồi
function renderReviewList(reviews, container) {
    if (!reviews.length) {
        container.innerHTML = `
            <p class="no-reviews">
                Sản phẩm chưa có đánh giá. Hãy là người đầu tiên đánh giá nhé!
            </p>
        `;
        return;
    }

    const mainReviews = reviews.filter(review => !review.parent_id);

    container.innerHTML = mainReviews.map(review => {
        const replies = reviews.filter(
            item => Number(item.parent_id) === Number(review.id)
        );

        return `
            <div class="review-item">
                <div class="review-user">
                    <strong>
                        ${escapeHTML(
                            review.full_name ||
                            review.user_name ||
                            "Khách hàng"
                        )}
                    </strong>

                    ${renderStars(review.rating)}

                    <span class="review-date">
                        ${formatDate(review.created_at)}
                    </span>
                </div>

                <p class="review-content">
                    ${escapeHTML(review.content)}
                </p>

                ${replies.map(reply => `
                    <div class="review-reply">
                        <strong>Phản hồi từ CenDeli</strong>

                        <p>${escapeHTML(reply.content)}</p>

                        <span class="review-date">
                            ${formatDate(reply.created_at)}
                        </span>
                    </div>
                `).join("")}
            </div>
        `;
    }).join("");
}

// Gửi đánh giá
function setupReviewForm() {
    const form = document.getElementById("review-form");
    const message = document.getElementById("review-message");
    const submitButton = document.getElementById("submit-review");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const token = getToken();
        const rating = Number(
            document.getElementById("review-rating").value
        );

        const content = document
            .getElementById("review-content")
            .value.trim();

        message.textContent = "";

        if (!token) {
            message.textContent =
                "Vui lòng đăng nhập để gửi đánh giá.";

            return;
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            message.textContent = "Vui lòng chọn từ 1 đến 5 sao.";
            return;
        }

        if (!content) {
            message.textContent = "Vui lòng nhập nội dung đánh giá.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Đang gửi...";

        try {
            const response = await fetch(
                `${API_URL}/product/${encodeURIComponent(productId)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        rating,
                        content
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Gửi đánh giá thất bại."
                );
            }

            message.textContent =
                "Đánh giá của bạn đã được gửi thành công!";

            form.reset();

            document.getElementById("review-rating").value = 5;

            document.querySelectorAll(".star-btn").forEach(button => {
                button.classList.toggle(
                    "selected",
                    Number(button.dataset.rating) <= 5
                );
            });

            await loadReviews();

        } catch (error) {
            console.error("Lỗi gửi đánh giá:", error);

            message.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Gửi đánh giá";
        }
    });
}

// Khởi chạy
document.addEventListener("DOMContentLoaded", function () {
    if (!reviewRoot) {
        console.warn("Không tìm thấy phần tử #reviews-root.");
        return;
    }

    if (!productId) {
        reviewRoot.textContent =
            "Không xác định được sản phẩm cần đánh giá.";
        return;
    }

    renderReviewLayout();
    loadReviews();
});
