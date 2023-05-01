const mongoose = require('mongoose');

const Book = require('../models/book');

module.exports = {};

module.exports.getAll = async (page, perPage, authorId) => {

  if (mongoose.Types.ObjectId.isValid(authorId)) {
    return await Book.find({ authorId: authorId }).lean();
  }
  return await Book.find().limit(perPage).skip(perPage * page).lean();
}

module.exports.getAllAuthorsStates = async (authorInfo) => {

  if (authorInfo) {
    return await Book.aggregate([
      {
        $group: {
          _id: '$authorId',
          averagePageCount: { $avg: '$pageCount' },
          numBooks: { $sum: 1 },
          titles: { $push: '$title' }
        }
      },
      {
        $lookup: {
          from: 'authors',
          localField: '_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $project: {
          _id: 0,
          authorId: '$_id',
          averagePageCount: 1,
          numBooks: 1,
          titles: 1,
          author: { $arrayElemAt: ['$author', 0] }
        }
      }
    ]);
  }

  return await Book.aggregate([
    {
      $group: {
        _id: '$authorId',
        numBooks: { $sum: 1 },
        averagePageCount: { $avg: '$pageCount' },
        titles: { $push: '$title' }
      }
    },
    {
      $project: {
        authorId: '$_id', 
        _id: 0,
        numBooks: 1,
        averagePageCount: 1,
        titles: 1
      }
    }
  ]);
}

module.exports.searchText = async (searchTerm) => {
  let result = await Book.find({ $text: { $search: searchTerm } }).lean();
  return result;
}

module.exports.getById = (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return null;
  }
  return Book.findOne({ _id: bookId }).lean();
}

module.exports.deleteById = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.deleteOne({ _id: bookId });
  return true;
}

module.exports.updateById = async (bookId, newObj) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.updateOne({ _id: bookId }, newObj);
  return true;
}

module.exports.create = async (bookData) => {
  try {
    const created = await Book.create(bookData);
    return created;
  } catch (e) {

    if (e.message.includes('validation failed')) {
      throw new BadDataError(e.message);
    }
    throw e;
  }
}

class BadDataError extends Error { };
module.exports.BadDataError = BadDataError;