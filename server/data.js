import bcrypt from 'bcryptjs';

const data = {

    users: [
      {
        name: "vicky",
        email: "vviicckkyy55@gmail.com",
        password: bcrypt.hashSync('toomuchfun', 8),
        phone: '7763097886',
        address: 'Varanasi',
        districtCity: 'Varanasi',
        stateUT: 'Uttar Pradesh',
        pincode: 221006,
        country: 'India',
        isItanimulli: true,
        isMaster: true,
        master: {
          name: "Paprika",
          logo: 'images/logo.png',
          description: 'good master',
          rating: 4.5 ,
          numReviews: 111,
        },
        isAlly: true,
        ally: {
          allyName: "Paprika",
          allyLogo: 'images/logo.png',
          allyDescription: 'good ally',
          allyRating: 4.5 ,
          allyNumReviews: 111,
        },
        isBrand: true,
        brand: {
          name: "Paprika",
          logo: 'images/logo.png',
          description: 'good master',
          rating: 4.5 ,
          numReviews: 111,
        },
        isCommissioner: true,
        commissioner: {
          commissionerName: "Paprika",
          commissionerLogo: 'images/logo.png',
          commissionerDescription: 'good master',
          commissionerRating: 4.5 ,
          commissionerNumReviews: 111,
        },
        isViewer: true,

        
      },
    ],

    assets:[
      {
        name: 'Paprika Asset',
        image: '../images/v1.png',
        location: 'Lanka, Near BHU',
        districtCity: 'Varanasi',
        stateUt: 'Uttar Pradesh',
        country: 'India',
        municipality: 'Varanasi Municipal Corporation',
        category: 'DOOH Asset',
        slotsAvailable: 7,
        costPerSlot: '100',
        rating: 4.0,
        numReviews: '21',
        description: "Quality Asset for advertising",
        // master: {"$oid": "60e7f209c2964350550c5ff6"},
        allyUploads: [],
        adverts: [],
        subscribers: [],
        usersLiked: [],
        pleas:[],
      },
    ],

    adverts: [
      {
        title: 'Vinciis test Steve Jobs Speech - Best Motivational Advert[via torchbrowser.com].mp4',
        advert: 'https://blinds-releasetest.s3.ap-south-1.amazonaws.com/Steve+Jobs+Speech+-+Best+Motivational+Advert%5Bvia+torchbrowser.com%5D.mp4',
        description: 'Steve Jobs Speech Motivation',
        like: 0,
        thumbnail: "https://blinds-releasetest.s3.ap-south-1.amazonaws.com/Assetshot_from_2021-07-05_11-16-51.png",
        uploaderName: "Vicky",
        views: 0,

      }
    ],

    pins: [
      {
        category: "asset",
        assetPin: true,
        asset: null,
        shopPin: false,
        shop: null,
        userPin: false,
        user: null,
        lat: 25.26,
        lon: 82.98,
      },
      {
        category: "asset",
        assetPin: true,
        asset: null,
        shopPin: false,
        shop: null,
        userPin: false,
        user: null,
        lat: 25.29,
        lon: 82.95,
      }
    ]
  };
  
  export default data;