import { Server } from 'socket.io';

export default ( server ) => {

    const io = new Server( server, { cors: { origin: '*' } }  );

    io.on( 'connection', ( socket ) => {

        // socket.on( 'input')

        socket.emit( 'print', 'hello!' );

        socket.on( '/textStream', ( val ) => {

            socket.emit( 'response', 'ok' );
            // const inputObj = { value: val };
            const inputObj = JSON.parse( val )
            
            submissions.textStream.push( inputObj );
            console.log( `New input added to Text Stream\nValue: "${ inputObj.value }"`);
            
            // Cut bracket and line break at the end before appending.
            const len = fs.readFileSync( filepaths.textStream ).length - 1
            fs.truncateSync( filepaths.textStream, len );

            // Add obj to array in ,txt
            const inputObjStr = JSON.stringify( inputObj, null, 2 );
            const sep = ',\n'
            fs.appendFileSync( filepaths.textStream, inputObjStr + sep + ']' );

            // Create an individual .txt file

            fs.writeFileSync( `./data/textStream/${inputObj.name}.txt`, inputObj.value, { flag: 'wx' } )

        });
        // socket.broadcast.emit()

    })

    return io;

}

