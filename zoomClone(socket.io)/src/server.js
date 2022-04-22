const http = require('http')
const express = require('express')
const {instrument} = require('@socket.io/admin-ui')
const {Server} = require('socket.io')


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
const io = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
}) //Socket.io 서버위에 http 서버를 동작시킨다.

instrument(io, {
    auth: false
})

// ================================================================ [ Socket.io 을 통한 서버에서 프론트엔드로 통신 ] ================================================================

function publicRooms(){
    const {sids, rooms} = io.sockets.adapter
    rooms // 비밀방 + 공개방
    sids // 비밀방

    const publicRooms = [];
    
    rooms.forEach((_,key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key)
        }
    })

    return publicRooms
}


function countRoom(roomName){
    return io.sockets.adapter.rooms.get(roomName)?.size
}



io.on('connection', (frontSocket) => {
    frontSocket["nickname"] = "익명"

    frontSocket.onAny((event) => {
        console.log(`Socket Event: ${event}`)
    })

    frontSocket.on('enter_room', (roomName, done) => {
        frontSocket.join(roomName)
        done()
        frontSocket.to(roomName).emit('welcome', frontSocket.nickname, countRoom(roomName))

        io.sockets.emit('room_change', publicRooms() )
    })

    frontSocket.on('disconnecting', (roomName) => {
        frontSocket.rooms.forEach((room)=>{
            frontSocket.to(room).emit('bye', frontSocket.nickname, countRoom(roomName) - 1)
        })
    })

    frontSocket.on('disconnect', () => {
        io.sockets.emit('room_change', publicRooms() )
    })


    frontSocket.on('new_message', (msg, room, done) => {
        frontSocket.to(room).emit('new_message', `${frontSocket.nickname} : ${msg}`)
        done()
    })

    frontSocket.on('nickname', (nickname) => {
        frontSocket["nickname"] = nickname
    })
})




// ================================================================ [ 서버 실행 ] ================================================================
const handleListen = () => {
    console.log('3000번 포트에서 실행중')
}
httpServer.listen(3000, handleListen)
