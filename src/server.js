const http = require('http')
const express = require('express')
const { WebSocketServer } = require('ws')

const app = express()


// ================================================================ [ HTTP 통신을 위한 서버설정 ] ================================================================
app.set('view engine', 'pug')
app.set('views', __dirname + "/views")

app.use('/public', express.static(__dirname + '/public'))

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/*', (req, res) => {
    res.redirect('/')
})



// ================================================================ [ HTTP & WS 병합을 위한 서버설정 ] ================================================================
const server = http.createServer(app) //http서버
const wss = new WebSocketServer({ server }) // 웹소켓 서버 -> http 서버와 위에서 동작(같은 PORT에서 두개의 프로토콜이 동작하게 된다.)


// ================================================================ [ WS 을 통한 서버에서 프론트엔드로 통신 ] ================================================================

const sockets = [] //연결된 접속자들 정보를 저장할 배열


wss.on("connection", (frontSocket) => {
    sockets.push(frontSocket) //배열에 socket 추가 : 사용자 추가와 같은말
    console.log('브라우저에 연결 😎')

    frontSocket["nickname"] = "익명"// socket에 nickname속성에 기본값의로 익명을 준다.
    
    // ===== [ 브라우저와 연결 끊김 ] =====
    frontSocket.on('close', () => { console.log('브라우저와의 연결 끊김 🥵') })

    // ===== [ 브라우저 에서 받은 메시지를 연결된 접속자(브라우저)에 다시 보내기 ] =====
    frontSocket.on('message', (message) => {
        const translatedMessage = message.toString('utf8'); //message utf8로 인코딩

        const parsed =  JSON.parse(translatedMessage) // JSON 문자열 -> JS객체로 변환후 변수에 저장
        console.log(parsed)

        if(parsed.type === "new_message"){
            sockets.forEach((aSocket) => { // 각각의 접속자들에게 메시지를 전달한다.
                aSocket.send(`${frontSocket.nickname}: ${parsed.payload}`) // 전달받은 닉네임, 메시지 값 출력
            })
        } else if(parsed.type === "nickname"){
            frontSocket["nickname"] = parsed.payload //socket nickname속성에 입력된 닉네임 값을 준다. => socket에는 이런식으로 데이터를 전달해줄수 있다.
        }

        console.log(frontSocket.nickname)
    })
}) 
// on매서드는 addeventListenr와 비슷하다 -> 이벤트 수신후 함수실행
// on매서드는 연결된 상대방의 정보를 받아온다 -> 이는 socket이라는 이름으로 받아오고 이벤트 이후 실행될 함수에 매개변수로 넘어간다. -> 이 socket은 연결된 브라우저에 대한 정보를 담고있다
// connection 이벤트는 다른 서버 혹은 클라이언트와 연결되었을때 발생하는 이벤트




// ================================================================ [ 서버 실행 ] ================================================================
const handleListen = () => {
    console.log('3000번 포트에서 실행중')
}
server.listen(3000, handleListen)
