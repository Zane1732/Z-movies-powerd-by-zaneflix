from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/proxy', methods=['POST'])
def proxy():
    try:
        data = request.get_json()
        url = data.get('url')
        method = data.get('method', '').upper()
        headers = data.get('headers', {})
        
        if not url: return jsonify({'error': 'URL is required'})
        if method not in ['GET', 'POST']: return jsonify({'error': 'Only GET and POST methods are allowed'})

        if method == 'GET': return requests.get(url, headers=headers).content
        else: form_data = data.get('form_data', {}); return requests.post(url, data=form_data, headers=headers).content
            
    except Exception as e: return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=False, port=5001, host='0.0.0.0')
