const http = require('http')
const express = require('express')
const SocketIo = require('socket.io')


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



// ================================================================ [ HTTP & Socket.io 병합을 위한 서버설정 ] ================================================================
const httpServer = http.createServer(app) //http서버
const io = SocketIo(httpServer)
//Socket.io 서버위에 http 서버를 동작시킨다.


// ================================================================ [ Socket.io 을 통한 서버에서 프론트엔드로 통신 ] ================================================================
io.on('connection', (frontSocket) => {
    frontSocket.on('join_room', (roomName) => {
        frontSocket.join(roomName)// 프론트에서 받아온 방이름을 통해 join
        frontSocket.to(roomName).emit('welcom')// 현재 방 입장했음을 알림
    })

    frontSocket.on('offer', (offer, roomName) => {// 프론트에서 offer,roomName정보를 받아온다
        frontSocket.to(roomName).emit('offer', offer) // 해당 roomName에 접속해있는 사람들에게 offer을 넘겨준다.
    })

    frontSocket.on('answer', (answer, roomName) => {// 프론트에서 answer,roomName정보를 받아온다
        frontSocket.to(roomName).emit('answer',answer)// 해당 roomName에 접속해있는 사람들에게 answer을 넘겨준다.
    })

    frontSocket.on('ice', (ice, roomName) => {// 프론트에서 ice,roomName정보를 받아온다
        frontSocket.to(roomName).emit('ice', ice)// 해당 roomName에 접속해있는 사람들에게 ice을 넘겨준다.
    })
})



// ================================================================ [ 서버 실행 ] ================================================================
const handleListen = () => {
    console.log('✅ 3000번 포트에서 실행중')
}
httpServer.listen(3000, handleListen)
