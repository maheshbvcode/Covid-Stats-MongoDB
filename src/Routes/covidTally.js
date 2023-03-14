const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const { connection } = require('../connector')

router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

router.get('/totalRecovered', (req, res) => {
    connection.find()
      .then(data => {
        let total = 0;
        for (i = 0; i < data.length; i++) {
          total += data[i].recovered
        }
        res.status(200).json({
          data: { _id: "total", recovered: total },
        })
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({
          status: "failed",
          message: "Unable to fetch the total number of recovered cases"
        })
      })
  })
  


  router.get('/totalActive', (req, res) => {
    connection.find()
      .then(data => {
        let totalRecoveredCases = 0;
        let totalInfectedCases = 0;
        for (i = 0; i < data.length; i++) {
          totalRecoveredCases += data[i].recovered
          totalInfectedCases += data[i].infected
        }
        const activeCases = totalInfectedCases - totalRecoveredCases
        res.status(200).json({
          data: { _id: "total", active: activeCases },
        })
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({
          status: "failed",
          message: "Unable to fetch the total number of active cases"
        })
      })
  })
  


  router.get('/totalDeath', (req, res) => {
    connection.find()
      .then(data => {
        let totalDeathCases = 0;
        for (i = 0; i < data.length; i++) {
          totalDeathCases += data[i].death
        }
        res.status(200).json({
          data: { _id: "total", death: totalDeathCases },
        })
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({
          status: "failed",
          message: "Unable to fetch the total number of death cases"
        })
      })
  })
  

// used aggregate $round
  router.get('/hotspotStates', async (req, res) => {

    try {
        const hotspotStates = await connection.aggregate([
            {
                $project: {
                    state: 1,
                    rate: {
                        $round: [
                            { $divide: [{ $subtract: ["$infected", "$recovered"] }, "$infected"] },
                            5
                        ]
                    }
                }
            },
            {
                $match: {
                    rate: { $gt: 0.1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    state: 1,
                    rate: 1
                }
            }
        ]);

        res.status(200).json({
            data: hotspotStates
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: error.message
        });
    }

});




// used aggregate $round
router.get('/healthyStates', async (req, res) => {
    try {
      const covidData = await connection.aggregate([
        {
          $project: {
            state: 1,
            death: 1,
            infected: 1,
            mortality: {
              $round: [{ $divide: ['$death', '$infected'] }, 5]
            }
          }
        },
        {
          $match: {
            mortality: { $lt: 0.005 }
          }
        },
        {
          $project: {
            _id: 0,
            state: 1,
            mortality: 1
          }
        }
      ]);
  
      res.status(200).json({ data: covidData });
    } catch (error) {
      res.status(500).json({
        status: "failed",
        message: error.message
      });
    }
  });
  

module.exports = router;