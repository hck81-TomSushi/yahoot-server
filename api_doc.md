# YAHOOT API Documentation

## Endpoints

- `POST /login`
- `GET /username`
- `GET /questions`
- `POST /hint`

## Welcome

### POST /login

Description : Log in with username

_Request body:_

```json
{
  "username": "string"
}
```

_Response (200 - OK)_

```json
{
  "access_token": "string",
  "username": "string"
}
```

_Response (400 - Bad Request)_

```json
{
    "error": "Username is required"
},
{
    "error": "Username minimum is 3 characters"
},
{
    "error": "Username must be alphanumeric"
}
```

### GET /username

Description: Get username.

_Response (200 - OK)_

```json
{
  "username": "string"
}
```

_Response (401 - Unauthorized)_

```json
{
  "error": "Unauthorized"
}
```

### GET /questions

Description: Get 10 randomized questions.

_Response (200 - OK)_

```json
{
    "questions": [
        {
            "id": 52,
            "question": "Berapakah hasil dari 9²?",
            "rightAnswer": "81",
            "answer1": "72",
            "answer2": "64",
            "answer3": "99",
            "category": "Math"
        },
        {
            "id": 49,
            "question": "Apa hasil dari 100 ÷ 4?",
            "rightAnswer": "25",
            "answer1": "20",
            "answer2": "30",
            "answer3": "22",
            "category": "Math"
        },
        ...
    ]
}
```

### POST /hint

Description: Get hint using Gemini AI to answer the question.

_Request body_

```json
{
  "question": "string",
  "answers": "string"
}
```

_Response (200 - OK)_

```json
{
  "hint": "string"
}
```

### Global Error

_Response (401 - Unauthorized)_

```json
{
  "error": "Unauthorized"
}
```

_Response (500 - Internal Server Error)_

```json
{
  "error": "Internal Server Error"
}
```
