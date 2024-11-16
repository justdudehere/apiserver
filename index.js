const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const bodyparser = require('body-parser'); 
const cors = require('cors');


const {initializeApp} = require('firebase/app');
const {getDatabase, ref, get, child} = require('firebase/database');


const firebaseConfig = {
    apiKey: "AIzaSyCjiM-h-XCmnkasrTeiZDgNpb0_RZ-a4Os",
    authDomain: "crmdude-f417a.firebaseapp.com",
    databaseURL: "https://crmdude-f417a-default-rtdb.firebaseio.com",
    projectId: "crmdude-f417a",
    storageBucket: "crmdude-f417a.firebasestorage.app",
    messagingSenderId: "363259586787",
    appId: "1:363259586787:web:1928db06595a9f6e057dd6",
    measurementId: "G-GBLQY3H58T"
  };


  const firebaseApp = initializeApp(firebaseConfig);
  const database = getDatabase(firebaseApp);






const app = express();
app.use(cors());
const PORT = 5000;


const readData = async () => {
    const userDataArray = [];
        const dbRef = ref(database, 'Subscriber');
        const snapshot = await get(dbRef);

        snapshot.forEach((childSnapshot) => {
            const name = childSnapshot.val().fullName;
            const mobile = childSnapshot.val().mobileNo;
            const due = childSnapshot.child("connectionDetails").val().dueAmount;
            const expire = childSnapshot.child("connectionDetails").val().expiryDate;
            

            userDataArray.push({name, mobile, due, expire});
        });

        return userDataArray;


        
}


const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('auth_failure', (message) => {
    console.log('Authentication failed:', message);
});


client.on('message', async (message) => {
    console.log(`Received message: ${message.body}`);
});

client.on('qr', (qr) => {
    console.log('Scan this QR code with your WhatsApp app:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');


});

client.initialize();

app.use(express.json());



app.post('/send-message', async (req, res) => {
    const { number, message } = req.query;

    if (!number || !message) {
        return res.status(400).send({ error: 'Please provide both number and message.' });
    }

    const chatId = `${number}@c.us`; // WhatsApp ID format
    try {
        await client.sendMessage(chatId, message);
        res.send({ status: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send({ error: 'Failed to send message.' });
    }
});

app.get('/', (req, res) => {
    res.send('WhatsApp API is running!');
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
