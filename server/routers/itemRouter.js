import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Item from '../models/itemModel.js';
import { isAuth } from '../utils.js';
import data from '../data.js';


const itemRouter = express.Router();



// seed data

itemRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        const uploader = await User.findOne();
        if (uploader) {
            const items = data.items.map((item) => ({
                ...item,
                uploader: uploader._id,
            }));
            const uploadedItems = await Item.insertMany(items);
            res.send({ uploadedItems });
        } else {
            res.status(500).send({
                message: 'No uploader found. first run /api/users/seed'
            });
        }
    })
)


//get all items

itemRouter.get('/', async (req, res) => {
    try {
        const allItems = await Item.find();
        if (allItems)
            return res.send(allItems);
        return res.status(401).send({ message: "No item found" });
    } catch (error) {
        return res.send(error);
    }
})

//view item

itemRouter.get('/:id', async (req, res) => {
    try {
        const requestedItem = await Item.findById(req.params.id);
        if (requestedItem) {
            return res.send(requestedItem);
        }
        else
            return res.status(401).send({ message: "item not found" });
    } catch (error) {
        return res.send(error);
    }
});



//update item

itemRouter.put(
    '/:id',
    isAuth,
    async (req, res) => {
        try {
            const item = await Item.findById(req.params.id);
            if (item) {
                item.description = req.body.description || item.description,
                item.title = req.body.title || item.title,
                item.thumbnail = req.body.thumbnail || item.thumbnail

                const updatedItem = await item.save();
                if (updatedItem)
                    return res.send({ message: 'item updated', item: updatedItem });
            }
            return res.status(401).send({ message: "item not found" });
        } catch (error) {
            return res.status(404).send(error);
        }
    }
);



//delete item 

itemRouter.delete(
    '/:id',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        try {
            const item = await Item.findById(req.params.id);
            if (item) {

                const uploaderId = item.uploader._id;

                const itemUploader = await User.findById(uploaderId);

                console.log('yes', item._id);   

                itemUploader.items.remove(item._id);
                const deletedItemUploader = await itemUploader.save();

        
                const deleteItem = await item.remove();

                console.log(deleteItem);
                return res.send({
                    message: 'item deleted',
                    item: deleteItem,
                    deletedItemUploader
                });
            }
            res.status(404).send({ message: "item not found" });
            return;
        } catch (error) {
            return res.send(error);
        }
    })
);



//like item

itemRouter.post(
    '/like/:id',
    isAuth,
    expressAsyncHandler( async (req, res) => {
        try {
            const likeItem = await Item.findById(req.params.id);
            const likeItemUser = await User.findById(req.user._id);
            if (!likeItem.likedBy.includes(req.user._id) && !likeItemUser.likedItems.includes(likeItem._id)) {
           
                likeItemUser.likedItems.push(likeItem._id);
                const likedItemUser = await likeItemUser.save();

                likeItem.likedBy.push(likeItemUser._id);
                const likedItem = await likeItem.save();

                console.log('liked item')

                return res.send({likedItem, likedItemUser});

            } else {
            return res.status(401).send("item not found")
            }
        } catch (error) {
            return res.send(error);
        }
    })
)

//unlike item

itemRouter.delete(
    '/like/:id',
    isAuth,
    async (req, res) => {
        try {
            const unlikeItem = await Item.findById(req.params.id);
            const unlikeItemUser = await User.findById(req.user._id);
            if (unlikeItem.likedBy.includes(req.user._id) && unlikeItemUser.likedItems.includes(unlikeItem._id)) {

                unlikeItemUser.likedItems.remove(unlikeItem._id);
                const unlikedItemUser = await unlikeItemUser.save();
                

                unlikeItem.likedBy.remove(unlikeItemUser._id);
                const unlikedItem = await unlikeItem.save();

                console.log('unliked item')

                return res.send({unlikedItem, unlikedItemUser});
            } else {
                return res.status(401).send("item not found")
            }
        } catch (error) {
            return res.send(error);
        }
    }
)





// views item

itemRouter.post('/view/:id', isAuth, async (req, res) => {
    try {
        const viewItem = await Item.findById(req.params.id);
        const viewItemUser = await User.findById(req.user._id);
        if (viewItem) {
            viewItem.views = viewItem.views + 1;

            if(!viewItem.viewedBy.includes(viewItemUser._id)){
                viewItem.viewedBy.push(viewItemUser._id)
                viewItemUser.viewedItems.push(viewItem._id);
                
                console.log('item viewed')
            }
            const viewedItem = await viewItem.save();
            const viewedItemUser = await viewItemUser.save();
            
            return res.send({viewedItem, viewedItemUser});
        }
        return res.status(401).send("item not found")
    } catch (error) {
        return res.send(error);
    }
})


//comment item

itemRouter.post(
    '/:id/reviews', 
    isAuth, 
    expressAsyncHandler(async (req, res) => {
        const  item = await Item.findById(req.params.id);
        if (item) {
            if (item.reviews.find((x) => x.name === req.user.name)) {
                return res
                  .status(400)
                  .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                comment: req.body.comment,
                rating: Number(req.body.rating),
            };

            item.reviews.push(review);
            item.numReviews = item.reviews.length;
            item.rating = 
                item.reviews.reduce((a, c) => c.rating + a, 0) /
                item.reviews.length;

            const updatedItem = await item.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedItem.reviews[updatedItem.reviews.length -1],
            });
        } else {
            res.status(401).send({ message: "item not found" });
        }
    })
)




export default itemRouter;