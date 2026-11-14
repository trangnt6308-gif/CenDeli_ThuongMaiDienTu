
document.addEventListener("DOMContentLoaded", function () {
  const policyIds = ["doi-tra", "van-chuyen", "bao-mat", "bao-hanh"];

  function openPolicyFromHash() {
    const id = decodeURIComponent(window.location.hash.slice(1));

    if (!policyIds.includes(id)) {
      return;
    }

    const selectedPolicy = document.getElementById(id);

    if (!selectedPolicy) {
      return;
    }

    // Đóng các chính sách khác
    policyIds.forEach(function (policyId) {
      const policy = document.getElementById(policyId);

      if (policy && policy !== selectedPolicy) {
        policy.open = false;
      }
    });

    // Mở chính sách được chọn
    selectedPolicy.open = true;

    // Cuộn đến đúng chính sách
    requestAnimationFrame(function () {
      selectedPolicy.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  // Xử lý khi truy cập trực tiếp bằng đường dẫn có #...
  openPolicyFromHash();

  // Xử lý khi người dùng nhấn liên kết Footer
  window.addEventListener("hashchange", openPolicyFromHash);
});
