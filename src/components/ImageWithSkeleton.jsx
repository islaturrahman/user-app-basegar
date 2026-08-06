import React, { useState } from 'react';
import { View, Image } from 'react-native';
import Skeleton from './Skeleton';

const ImageWithSkeleton = ({ source, style, resizeMode, defaultSource, ...props }) => {
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Safety fallback: turn off skeleton after 3 seconds if events fail to fire
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [source]);

  return (
    <View style={[style, { overflow: 'hidden', position: 'relative' }]} {...props}>
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 10 }}>
          <Skeleton width="100%" height="100%" borderRadius={0} />
        </View>
      )}
      <Image
        source={source}
        style={{ width: '100%', height: '100%' }}
        resizeMode={resizeMode}
        defaultSource={defaultSource}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
};

export default ImageWithSkeleton;
