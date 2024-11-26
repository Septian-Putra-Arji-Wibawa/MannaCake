require('dotenv').config(); // Jika menggunakan dotenv
const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Mengatur EJS sebagai view engine
app.set('view engine', 'ejs');

// Mengatur direktori views untuk mencari template EJS
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk file statis
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));



// Konfigurasi database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Ganti dengan username MySQL Anda
    password: '', // Ganti dengan password MySQL Anda
    database: 'mannacake'
});

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Folder tujuan upload
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nama file unik
    }
});
const upload = multer({ storage: storage });





//CRUD
// const bodyParser = require('body-parser');

// Rute untuk halaman form upload
app.get('/crudadminkue', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'upload.html'));
});

// Rute untuk menangani form upload
app.post('/upload', upload.single('foto_produk'), (req, res) => {
    const { nama_produk, deskripsi, harga } = req.body;
    const foto_produk = `/uploads/${req.file.filename}`; // Path foto

    // Query untuk menyimpan data ke database
    const sql = 'INSERT INTO produk (nama_produk, deskripsi, harga, foto_produk) VALUES (?, ?, ?, ?)';
    db.query(sql, [nama_produk, deskripsi, harga, foto_produk], (err, result) => {
        if (err) {
            console.error('Gagal menyimpan data:', err.message);
            res.send('Terjadi kesalahan saat menyimpan data.');
        } else {
            res.redirect('/crudadminkue');
        }
    });
});

// Rute untuk mengambil semua produk dan mengirimkan dalam format JSON
app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM produk';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Gagal mengambil data produk:', err.message);
            res.status(500).send('Terjadi kesalahan saat mengambil data.');
        } else {
            res.json(results);  // Mengirimkan hasil sebagai JSON
        }
    });
});


// Rute untuk menghapus produk dan gambar
app.delete('/delete/:id', (req, res) => {
    const produkId = req.params.id;
    const sql = 'SELECT foto_produk FROM produk WHERE id = ?';
    
    db.query(sql, [produkId], (err, result) => {
        if (err) {
            console.error('Gagal mengambil data produk:', err.message);
            return res.status(500).send('Terjadi kesalahan saat mengambil data produk.');
        }
        
        if (result.length > 0) {
            const fotoPath = path.join(__dirname, 'public', result[0].foto_produk);
            
            // Hapus gambar produk dari server
            fs.unlink(fotoPath, (err) => {
                if (err) {
                    console.error('Gagal menghapus foto:', err.message);
                }
            });
            
            // Hapus produk dari database
            const deleteSql = 'DELETE FROM produk WHERE id = ?';
            db.query(deleteSql, [produkId], (err, result) => {
                if (err) {
                    console.error('Gagal menghapus produk:', err.message);
                    return res.status(500).send('Terjadi kesalahan saat menghapus produk.');
                }

                res.send('Produk berhasil dihapus!');
            });
        } else {
            res.send('Produk tidak ditemukan.');
        }
    });
});


// Rute untuk login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});


// Endpoint Login Admin

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
  
    // Cari admin berdasarkan username
    const query = 'SELECT * FROM admin WHERE username = ?';
    db.query(query, [username], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Gagal memproses login.');
      }
  
      if (results.length > 0) {
        const user = results[0];
  
        // Bandingkan password yang diinput dengan hash di database
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          res.redirect('/crudadminkue');
        } else { 
          res.redirect('/login');
        }
      } else {
        res.redirect('/login');
      }
    });
  });
  



// Rute untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rute untuk halaman produk
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

// Rute untuk halaman tentang
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'galeri.html'));
});




// Koneksi ke database
db.connect((err) => {
    if (err) {
        console.error('Gagal terhubung ke database:', err.message);
    } else {
        console.log('Berhasil terhubung ke database.');
    }
});

// Jalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});

