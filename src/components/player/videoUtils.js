// Utility functions for video quality options
import CryptoJS from 'crypto-js';
import config from '../../config.json';

export async function fetchKwikVideoUrl(kwikLink) {
  try {
    const response = await fetch('https://access-kwik.apex-cloud.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "service": "kwik",
        "action": "fetch",
        "content": {
          "kwik": kwikLink
        },
        "auth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.O0FKaqhJjEZgCAVfZoLz6Pjd7Gs9Kv6qi0P8RyATjaE"
      })
    });

    const data = await response.json();

    if (data.status && data.content && data.content.url) {
      return data.content.url;
    } else {
      console.error('Invalid response from Kwik API:', data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching video URL:', error);
    return null;
  }
}

export async function fetchVidSrcContent(id, episode, season, type) {
  try {
    let apiUrl;
    if (type === 'movie') {
      apiUrl = `https://player.vidsrc.co/api/server?id=${id}&sr=1`;
    } else {
      apiUrl = `https://player.vidsrc.co/api/server?id=${id}&sr=1&ep=${episode}&ss=${season}`;
    }
    
    const streamResponse = await fetch(config.proxy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        url: apiUrl,
        method: 'GET',
        headers: {
          'Referer': 'https://player.vidsrc.co/',
          'Origin': 'https://player.vidsrc.co'
        }
      })
    });
    
    if (!streamResponse.ok) {
      throw new Error(`HTTP error! status: ${streamResponse.status}`);
    }
    
    const responseData = await streamResponse.json();
    
    if (!responseData) {
      throw new Error('Empty response from server');
    }
    
    if (responseData && responseData.data) {
      try {
        const decodedData = atob(responseData.data);
        const encryptedData = JSON.parse(decodedData);
        
        const decryptedData = decryptWithPassword(encryptedData);
        if (!decryptedData) {
          throw new Error('Failed to decrypt data');
        }
        
        const streamData = JSON.parse(decryptedData);
        
        if (!streamData || !streamData.url) {
          throw new Error('Invalid stream data format');
        }
        
        return streamData;
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        throw new Error('Failed to process stream data');
      }
    } else if (responseData && responseData.url) {
      return responseData;
    } else {
      throw new Error('No streaming source found in response');
    }
  } catch (error) {
    console.error('Error fetching VidSrc content:', error);
    throw error;
  }
}

function decryptWithPassword(e) {
  try {
    let t = CryptoJS.enc.Hex.parse(e.salt),
        a = CryptoJS.enc.Hex.parse(e.iv),
        n = e.encryptedData,
        l = CryptoJS.PBKDF2(e.key, t, {
          keySize: 8,
          iterations: e.iterations,
          hasher: CryptoJS.algo.SHA256
        }),
        o = CryptoJS.AES.decrypt(n, l, {
          iv: a,
          padding: CryptoJS.pad.Pkcs7,
          mode: CryptoJS.mode.CBC
        });
    
    const decrypted = o.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}