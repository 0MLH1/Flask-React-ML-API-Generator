from database.connection import get_connection
from datetime import datetime

def save_model_metadata(name: str, description: str, best_algorithm: str, justification: str):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        INSERT INTO models (name, description, best_algorithm, justification, created_at)
        VALUES (%s, %s, %s, %s, %s)
    """

    cursor.execute(query, (name, description, best_algorithm, justification, datetime.now()))
    conn.commit()

    cursor.close()
    conn.close()

def list_models():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM models ORDER BY created_at DESC")

    rows = cursor.fetchall()

    cursor.close()
    conn.close()
    return rows
