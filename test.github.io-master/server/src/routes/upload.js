const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const { authenticate } = require('../middleware/auth')
const { asyncHandler, AppError } = require('../middleware/errorHandler')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueFilename = `${uuidv4()}${ext}`
    cb(null, uniqueFilename)
  }
})

const fileFilter = (req, file, cb) => {
  if (req.headers['x-upload-category'] === 'products') {
    if (file.mimetype === 'image/png' || file.originalname.toLowerCase().endsWith('.png')) {
      cb(null, true)
    } else {
      cb(new Error('仅允许上传PNG格式图片'), false)
    }
  } else {
    cb(null, true)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

router.post('/',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('没有上传文件', 400, 'NO_FILE')
    }

    const fileUrl = `/api/uploads/${req.file.filename}`

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        files: [{
          name: req.file.originalname,
          url: fileUrl,
          size: req.file.size,
          type: path.extname(req.file.originalname).toLowerCase(),
          originalName: req.file.originalname,
          filename: req.file.filename
        }]
      }
    })
  })
)

router.get('/:filename',
  asyncHandler(async (req, res) => {
    const filename = req.params.filename
    const filepath = path.join(UPLOAD_DIR, filename)

    if (!fs.existsSync(filepath)) {
      throw new AppError('文件不存在', 404, 'FILE_NOT_FOUND')
    }

    const ext = path.extname(filename).toLowerCase()
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    }

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const fileStream = fs.createReadStream(filepath)
    fileStream.pipe(res)
  })
)

module.exports = router