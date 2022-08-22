import * as fs from 'fs';
import fetch from 'node-fetch';

const directories = [ 'Past', 'Present', 'Future' ]

directories.forEach( dir => {
    fs.readdirSync(`./curatedText/${dir}/`)
        .forEach(file => {
            // if ( file == 'Dane_Joneshill.txt' ) {
                if ( file.includes( 'Marathi' ) ) return;
                const text = fs.readFileSync( `./curatedText/${dir}/${file}`, { encoding: 'ascii' } );
                // console.log( [...text.trim()] );
                const arr = text.trim().split( '\r\n' );
                const packet = {
                    input: arr[0],
                    name: arr[2],
                    verified: true
                }
                
                if ( !packet.name ) console.log( `${dir}/${file}` );
                // console.log( packet );

                fetch( 'http://localhost:4060/textStream/input', {
                    method: 'POST', // or 'PUT',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        // "Access-Control-Allow-Headers" : "Content-Type",
                        // "Access-Control-Allow-Origin": "*",
                        // "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                    },
                    body: JSON.stringify(packet),
                })
            // }
        }
    )
});