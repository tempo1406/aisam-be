1. Truy cập vào facebook developer qua link: 
https://developers.facebook.com/

2. Login với tài khoản mà mình muốn lấy access_token

3. Qua các bước đăng nhập, xin quyền auth từ facebook

4. Vào link này để dùng graphQL api của facebook
https://developers.facebook.com/tools/explorer/

5. Access token của fb khi hiện sẽ có thời hạn sử dùng tầm vài tiếng, nếu muốn cấp thời gian sử dụng tầm 60 ngày thì phải xin qua các bước:
5.1 Vào app qua link
https://developers.facebook.com/apps/

5.2 Chọn app của mình

5.3 Vào mục cài đặt ứng dụng -> Thông tin cơ bản bạn sẽ thấy
ID ứng dụng vá Khóa bí mật của ứng dụng

5.4 Copy cái này past vô thanh test grapQL để đổi từ token ngắn hạn, lưu ý thay đổi thông số và xoá cái dấu {} , fb_exchange_token={access_token} là token ngắn hạn đã gắn mấy cái quyền permission của bạn, nhớ gắn để có thể post bài:
oauth/access_token?grant_type=fb_exchange_token&client_id={client_id}&client_secret={client_secret}&fb_exchange_token={access_token}

6. Bỏ access token của bạn vào body tạo social để try thôi nào

BONUS: 
* Check expired của accesstoken: (bỏ vào và check thôi)
https://developers.facebook.com/tools/debug/accesstoken