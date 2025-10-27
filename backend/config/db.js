const mongoose = require('mongoose');

module.exports = function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  mongoose.set('strictQuery', true);
  mongoose
    .connect(uri, { autoIndex: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('Mongo error', err);
      process.exit(1);
    });
};
