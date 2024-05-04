
'use strict'

const client = require('ari-client');

const generarAudio = require('./extras/tts');
const convertirAudio = require('./extras/sox');

//base de datos
///const connection = require('./db');
const { connection, consultasDB } = require('./db');

//-----------------------------------------------------

let cedula = '';
let datosReserva = '';
let cedulaReserva = '';
let fecha = '';
let query = '';
let resultado = '';
let text = '';
const pathAudios = `sound:/${__dirname}/gsm/audio`;


client.connect('http://localhost:8088', 'asterisk', 'asterisk', clientLoaded);


function clientLoaded (err, ari) {

  if (err) {
    throw err; // program will crash if it fails to connect
  }

  // Use once to start the application
  ari.on('StasisStart', stasisStart);
  //client.on('StasisEnd', stasisEnd);

  function stasisStart(event, incoming) {  
    //console.log('Channel %s has entered the application', channel.name);
    //channel.on('ChannelDtmfReceived', dtmfReceived);

  // Handler for StasisStart event
    incoming.answer(setTimeout((err) => {
      if (err) {
        throw err;
      }
      play(incoming, 'sound:menuIntro')
    }, 3000));

    incoming.on('ChannelDtmfReceived', introMenu);

    async function introMenu(event, channel) {

      const digit = event.digit;

      switch (digit) {
        case '1':    //Consultar reserva
          incoming.removeListener('ChannelDtmfReceived', introMenu);
          play(channel, 'sound:cedulaReserva');
          consult(event, incoming, channel)
          break;

        case '2': //Agendar reserva
          incoming.removeListener('ChannelDtmfReceived', introMenu);
          play(channel, 'sound:datosReserva');
          bookings(event, incoming);
          break;
        default:
          console.log('default')
          text = 'opción no válida, inténtelo de nuevo'
          await generarAudio(text);
          await convertirAudio();
          play(channel, pathAudios)
          //play(channel, 'sound:introduccion')
          break;
      }
    }

    function consult(event, incoming, channel) {
      cedula = '';
      console.log('---------consulta reserva---------');
      incoming.on('ChannelDtmfReceived', reservaCedula);
    }

    function bookings(event, incoming) {
      datosReserva = '';
      console.log('---------Agendar reserva---------');
      incoming.on('ChannelDtmfReceived', agendarReserva);
    }

  };


  /**
   *  Initiate a playback on the given channel.
   *
   *  @function play
   *  @memberof example
   *  @param {module:resources~Channel} channel - the channel to send the
   *    playback to
   *  @param {string} sound - the string identifier of the sound to play
   *  @param {Function} callback - callback invoked once playback is finished
   */
  function play(channel, sound, callback) {
    var playback = ari.Playback();
    playback.once('PlaybackFinished',
      function (event, instance) {

        if (callback) {
          callback(null);
        }
      });
    channel.play({ media: sound }, playback, function (err, playback) { });
  }

  async function reservaCedula(event, incoming) {

    let dato = event.digit;

    // Grabacion de peticion de cedula y marcacion de #
    switch (dato) {
      case '#':
        incoming.removeListener('ChannelDtmfReceived', reservaCedula);
        query = `SELECT * FROM reservas r JOIN usuarios u ON u.cedula = r.cedulaCliente WHERE u.cedula = ${cedula} LIMIT 1`

        resultado = await consultasDB(query)
          .then(function (resultado) {

            if (!resultado) return

            switch (resultado.resultado) {
              case 0:
                text = `${resultado.nombre}no tiene Reserva`
                break;

              case 1:
                text = `${resultado.nombre}Si tiene una Reserva a su nombre`
                break;

              case 2:
                text = `${resultado.nombre}Se reserva esta en espera`
                break;

              default:
                break;
            }
          })
          .catch(text = 'La consulta realizada ha sido fallida, intente de nuevo')

        await generarAudio(text);
        await convertirAudio()

        query = '';
        await play(incoming, pathAudios);
        incoming.removeListener('ChannelDtmfReceived', agendarReserva);

        setTimeout(function () {
          colgarLLamada(incoming);
        }, 5000)

        break;

      case '*':
        cedula = '';
        incoming.removeListener('ChannelDtmfReceived', reservaCedula);
        incoming.on('ChannelDtmfReceived', reservaCedula)
        break

      default:
        cedula += dato;
        console.log('guardando cedula');
        console.log(cedula);
        break;
    }
  }


  async function agendarReserva(event, incoming) {

    let dato = event.digit;

    //play(incoming, 'sound:hello-world');//Ingresa la fecha y cedula separados por * NOTA: No olvidar recordar el formato de los datos en el audio...

    // Grabacion de peticion de cedula y marcacion de #
    switch (dato) {
      case '#':
        incoming.removeListener('ChannelDtmfReceived', agendarReserva);

        datosReserva = datosReserva.split('*');
        cedulaReserva = datosReserva[0];
        fecha = datosReserva[1];

        const day = fecha.slice(6, 8);
        const month = fecha.slice(4, 6);
        const year = fecha.slice(0, 4);

        fecha = `${year}-${month}-${day}`;

        //console.log(`Cedula: ${cedulaReserva} y fecha: ${fecha}`);

        query = `INSERT INTO reservas (cedulaCliente, fecha) VALUES ('${cedulaReserva}', '${fecha}')`;

        await consultasDB(query)
          .then(async function () {

            text = 'Su reserva ha sido agendada correctamente.'
          })
          .catch(function () {
            text = 'No se ha podido agendar su reserva, inténtelo de nuevo'
          });

        await generarAudio(text);
        await convertirAudio()
        await play(incoming, pathAudios);


        await setTimeout(function () {
          colgarLLamada(incoming);
        }, 5000)


        query = '';
        cedulaReserva = '';
        fecha = '';
        datosReserva = '';

        //play(incoming, 'sound:vm-goodbye');//Confirmacion de datos

        break;

      default:
        datosReserva += dato;
        console.log('guardando datos de la reserva');
        break;
    }
  }

  function colgarLLamada(incoming) {
    setTimeout(function () {
      incoming.hangup()
    }, 2000);
  }

  // can also use ari.start(['app-name'...]) to start multiple applications
  ari.start('restautante');

};