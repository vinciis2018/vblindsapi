import jwt from 'jsonwebtoken';

// to keep logged in info
export const generateToken = (user) => {
  return jwt.sign(
    {
    _id: user._id,
    name: user.name,
    email: user.email,
    isItanimulli: user.isItanimulli,
    isMaster: user.isMaster,
    isAlly: user.isAlly,
    isBrand: user.isBrand,
    isCommissioner: user.isCommissioner,
    isViewer: user.isViewer,
    defaultWallet: user.defaultWallet,
    createdAt: user.createdAt,
  }, 
  process.env.ACCESS_TOKEN_JWT_SECRET || 'mysecretkey',
    {
      expiresIn: '100h',
    } 
  );
};

// to authenticate user
export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(authorization) {
    const token = authorization.slice(7, authorization.length);  //Bearer XXXXXXXX... (removes Bearer_ and gives token XXXXXXXXX...)
    // console.log(token);
    jwt.verify(
      token, process.env.ACCESS_TOKEN_JWT_SECRET || 'mysecretkey', 
      (err, decode) => {
        if(err) {
          res.status(401).send({message: 'Please Signin Again to continue' });
        } 
        else {
          req.user = decode;
          next();
          return;
        }
      });
  } else {
    return res.status(401).send({message: 'Sign in issue'});
  }
}

// for usercontrol
export const auth = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization.slice(7, authorization.length);  //Bearer XXXXXXXX... (removes Bearer_ and gives token XXXXXXXXX...)

      if(!token) return res.status(400).json({msg: "Invalid Authentication."})

      jwt.verify(token, process.env.ACCESS_TOKEN_JWT_SECRET, (err, user) => {
          if(err) return res.status(400).json({msg: "Invalid JWT token."})

          req.user = user
          next()
      })
  } catch (err) {
      return res.status(500).json({msg: err.message})
  }
}

// for usercontrol
export const authAdmin = async (req, res, next) => {
  try {
      const user = await Users.findOne({_id: req.user.id})

      if(user.role !== 1) 
          return res.status(500).json({msg: "Admin resources access denied."})

      next()
  } catch (err) {
      return res.status(500).json({msg: err.message})
  }
}

// admin 

export const isItanimulli = (req, res, next) => {
  if (req.user && req.user.isItanimulli) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Not an admin'
    })
  }
};

// master

export const isMaster = (req, res, next) => {
  if (req.user && req.user.isMaster) {
    next();
  } else {
    res.status(401).send({
      message: 'Not a master'
    })
  }
};


// Ally

export const isAlly = (req, res, next) => {
  if (req.user && req.user.isAlly) {
    next();
  } else {
    res.status(401).send({
      message: 'Not an ally'
    })
  }
};



// Brand

export const isBrand = (req, res, next) => {
  if (req.user && req.user.isBrand) {
    next();
  } else {
    res.status(401).send({
      message: 'Not a brand'
    })
  }
};


// Commissioner

export const isCommissioner = (req, res, next) => {
  if (req.user && req.user.isCommissioner) {
    next();
  } else {
    res.status(401).send({
      message: 'Not a commissioner'
    })
  }
};



// viewer

export const isViewer = (req, res, next) => {
  if (req.user && req.user.isViewer) {
    next();
  } else {
    res.status(401).send({
      message: 'Not a viewer'
    })
  }
};



// master or admin

export const isItanimulliOrMaster = (req, res, next) => {
  if (req.user && (req.user.isItanimulli || req.user.isMaster)) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Neither an admin nor a master' 
    });
  }
};


// ally or admin

export const isItanimulliOrAlly = (req, res, next) => {
  if (req.user && (req.user.isItanimulli || req.user.isAlly)) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Neither an admin nor an ally' 
    });
  }
};


// master or ally

export const isMasterOrAlly = (req, res, next) => {
  if (req.user && (req.user.isMaster || req.user.isAlly)) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Neither a master nor an ally' 
    });
  }
};

// brand or ally

export const isBrandOrAlly = (req, res, next) => {
  if (req.user && (req.user.isBrand || req.user.isAlly)) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Neither a brand nor an ally' 
    });
  }
};

// ally or admin

export const isItanimulliOrBrand = (req, res, next) => {
  if (req.user && (req.user.isItanimulli || req.user.isBrand)) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Neither an admin nor a brand' 
    });
  }
};




// Commmissioner or master

export const isCommissionerOrMaster = (req, res, next) => {
  if (req.user && (req.user.isCommissioner || req.user.isMaster)) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Neither a commissioner nor a master' 
    });
  }
};


// Commissioner or ally

export const isCommissionerOrAlly = (req, res, next) => {
  if (req.user && (req.user.isCommissioner || req.user.isAlly)) {
    next();
  } else {
    res.status(401).send({ 
      message: 'Neither a commissioner nor an ally' 
    });
  }
};
