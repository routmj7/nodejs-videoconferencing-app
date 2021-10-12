const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/video-conference-project', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex:  true,
    useFindAndModify: false
})
