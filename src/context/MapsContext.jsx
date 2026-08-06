import React from 'react';
const MapsContext = React.createContext(
    {
        map: null,
        setMap: () => { },
    }
);
export default MapsContext;