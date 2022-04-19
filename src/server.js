const express = require('express')

const app = express()

app.set('view engine', 'pug')
app.set('views', __dirname + "/views")

app.use('/public', express.static(__dirname + '/public'))

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/*', (req, res) => {
    res.redirect('/')
})


const handleListen = () => {
    console.log('3000번 포트에서 실행중')
}
app.listen(3000, handleListen)