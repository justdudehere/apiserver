const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const qrcodeFront  = require('qrcode');
const bodyparser = require('body-parser'); 
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const {initializeApp} = require('firebase/app');
const {getDatabase, ref, get, set} = require('firebase/database');


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
app.use(bodyparser.json());
const PORT = 5000;


const upload = multer({ dest: 'uploads/' });
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sigmafibernet.71@gmail.com',
      pass: 'ljofvkmshapwfaio',
    },
  });

const readData = async () => {
    const userDataArray = [];
        const dbRef = ref(database, 'Subscriber');
        const snapshot = await get(dbRef);

        snapshot.forEach((childSnapshot) => {
            const name = childSnapshot.val().fullName;
            const mobile = childSnapshot.val().mobileNo;
            const due = childSnapshot.child("connectionDetails").val().dueAmount;
            const expire = childSnapshot.child("connectionDetails").val().expiryDate;
            const userid = childSnapshot.key;
            const address = childSnapshot.child("installationAddress").val();
            

            userDataArray.push({name, mobile, due, expire, userid});
        });

        return userDataArray;


        
}

const userMao = {};


const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('auth_failure', (message) => {
    console.log('Authentication failed:', message);
});


client.on('message', async (message) => {
    console.log(`Received message: ${message.body}`);

    const user = await readData();
    const senderNumber = message.from.split('@')[0];
    const matchedUser = user.find(user => `91${user.mobile}` === senderNumber || userMao[senderNumber]);

    if(!matchedUser || message.body.trim().length === 10){
            const enteredNumber = message.body.trim();
            const matchedUser = user.find(user => user.mobile === enteredNumber);
            if(matchedUser){
                userMao[senderNumber] = `91${matchedUser.mobile}`;
                client.sendMessage(message.from, `Hello ${matchedUser.name}, Now you can continue by send message "hello" or "hi"`);
            }else{
                client.sendMessage(message.from, `This mobile number is not registered with us. Please enter a valid mobile number.`);
            }
    }



    if(matchedUser && (message.body.toLowerCase() === 'hello' || message.body.toLowerCase() === 'hi')){
        client.sendMessage(message.from, `Hello ${matchedUser.name}, Please Enter any number to continue.\n1. Recharge\n2. Complaint\n3. New Connection\n4. OTT/IPTV`);
    }

    if(matchedUser && message.body.toLowerCase() === "1"){
        client.sendMessage(message.from, `Please Enter the Amount you want to pay`);
    }

    if(matchedUser && message.body.toLowerCase() === "2"){
        client.sendMessage(message.from, `Please Enter Any alphabet\na. Red Light on Device (Wire Cut)\nb. General Complaint\nc. Facing Speed Issue\nd. Device Shifting\ne. Other`);
    }




    if(matchedUser && (message.body.toLowerCase() === "a" || message.body.toLowerCase() === "b" ||  message.body.toLowerCase() === "c" || message.body.toLowerCase() === "d" || message.body.toLowerCase() === "e")){
        const timeStamp = Date.now();
        const ticketno = `TIC-${timeStamp}`;
        const recevied = message.body.toLowerCase();
        let concern = "";

            if(recevied === 'a'){
                concern = "Red Light"
            }else if(recevied === 'b'){
                concern = "General Complaint"
            }else if(recevied === 'c'){
                concern = "Speed Issue"
            }else if(recevied === 'd'){
                concern = "Device Shifting"
            }else if(recevied === 'e'){
                concern === "Other"
            }

        client.sendMessage(message.from, `${matchedUser.name}, Yout Complaint ticket is raised for concern ${concern} and yout ticket no. is ${ticketno} , our team contact you soon as possible. \nThanks For Choosing us.`);
        

        const generateTicket = async () => {
            
            const ticketDataGlobal = {
                generatedBy: "Cutomer",
                ticketno: ticketno,
                source: 'Whatsapp',
                ticketconcern: concern,
                assignto: "",
                description: "",
                assigntime: "",
                assigndate: "",
                status: 'Unassigned',
                closedate: '',
                closeby: '',
                closetime: '',
                rac: '',
                generatedDate: new Date().toISOString().split('T')[0],
                userid: matchedUser.userid,

            }


            const ticketdata = {
                generatedBy: "Customer",
                source: 'Whatsapp',
                ticketno: ticketno,
                ticketconcern: concern,
                assignto: "",
                description: "",
                assigntime: "",
                assigndate: "",
                status: 'Unassigned',
                closedate: '',
                closeby: '',
                closetime: '',
                rac: '',
                generatedDate: new Date().toISOString().split('T')[0]
              }

              await set(ref(database, `Subscriber/${matchedUser.userid}/Tickets/${ticketno}`), ticketdata);
              await set(ref(database, `Global Tickets/${ticketno}`), ticketDataGlobal);
        


            
        }

        generateTicket();
    }

});

// When the QR code is generated, convert it to Base64 and send to frontend
client.on('qr', (qr) => {
    console.log('QR Code generated, send it to the frontend.');

    // Convert QR code to Base64
    qrcodeFront.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Error generating QR code:', err);
            return;
        }
        
        // Save the QR code in a variable or send it directly to the frontend
        app.get('/qr', (req, res) => {
            res.json({ qr: url }); // Send the QR code as a Base64 string
        });
    });
});

client.on('ready', async () => {
    console.log('WhatsApp client is ready!');

    
    
});


client.initialize();


app.use(express.json());


//Whatsapp Apis




//Send Text Message
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



//Email APIs

//Send Normal Tet Only Mail
app.post('/sendmail', async (req, res) => {
    const { to, subject, text, html } = req.body;
  
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ message: 'Missing required fields: to, subject, text, or html.' });
    }
  
    try {
        await transporter.sendMail(mailOptions);
  
      const mailOptions = {
        from: 'Sigma Business Solutions <sigmafibernet.71@gmail.com>',
        to,
        subject,
        text,
        html,
      };
  
      const info = await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully!', info });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send email.', error });
    }
  });

//Send Mail With Attachment
app.post('/send-invoice', upload.single('pdf'), async (req, res) => {
    const { to, subject, text } = req.body;
    const pdfFile = req.file; // The uploaded PDF file

    if (!pdfFile) {
        return res.status(400).json({ message: 'No PDF file uploaded.' });
    }

    

    // Email options
    const mailOptions = {
        from: 'Sigma Business Solutions <sigmafibernet.71@gmail.com>',
        to: to,
        subject: subject,
        text: text,
        attachments: [
            {
                filename: pdfFile.originalname, // Original file name
                path: pdfFile.path, // Path to the temporary file
            },
        ],
    };

    try {
        // Send the email
        
        await transporter.sendMail(mailOptions);

        // Remove the temporary file
        fs.unlinkSync(pdfFile.path);

        res.status(200).json({ message: 'Invoice sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send invoice.', error });

        // Remove the temporary file in case of error
        fs.unlinkSync(pdfFile.path);
    }
});
  

app.get('/favicon.ico', (req, res) => res.status(204).end());


app.get('/', (req, res) => {
    res.send('WhatsApp API is running!');
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
