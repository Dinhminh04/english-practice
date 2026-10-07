// custom-notify.js
(function($) {
  if (!$) return;

  $.notify = function(options, settings) {
    // Fallback sử dụng SweetAlert nếu notify không tồn tại
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: settings?.type || 'info',
        title: options.title || 'Notification',
        text: options.message,
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } else {
      // Fallback đơn giản sử dụng console
      console.log('Notification:', options);
    }
  };
})(window.$);