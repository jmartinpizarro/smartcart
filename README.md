# smartcart
Market system with AI model that detects products and adds them to your cart

## Instalation

```bash
npm i
```

## Main Points
Usage of:
- Node
- Express - [docs](https://expressjs.com/en/starter/installing.html)
- Socket.io - [docs](https://socket.io/docs/v4/server-initialization/)

As when doing `node .` we will be executing the backend, the entrance file is `server.js`

## The project

```bash
node .
```

Then go to `localhost:3000` to start being served with the statics pages of the project.

## The Neural Network. 

A CNN network for the sake of learning ML and applying it to a real-case project. The [dataset](https://github.com/PhilJd/freiburg_groceries_dataset) will be used for it.

It will be necessary to reformat all the images into a 224x224 images for a ResNet CNN neural network. A paper will be done in order to discuss more about this.

> [!INFO]
> I need to do the paper. Relax.
