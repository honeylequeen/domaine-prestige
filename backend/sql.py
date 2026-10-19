# Database helpers for the Domaine Prestige API
# Based on the CIS 2368 class connection code.
#
# All queries take a separate `params` tuple. The MySQL driver fills in the
# %s placeholders safely, so user input is never pasted directly into SQL
# (this is what prevents SQL injection).

import mysql.connector
from mysql.connector import Error


def DBconnection(hostname, uname, pwd, dbname, port=3306):
    con = None
    try:
        con = mysql.connector.connect(
            host=hostname,
            port=port,
            user=uname,
            password=pwd,
            database=dbname
        )
    except Error as e:
        print("Connection unsuccessful due to Error ", e)
    return con


# Run a SELECT and return the rows as a list of dictionaries
def execute_read_query(con, sql, params=None):
    mycursor = con.cursor(dictionary=True)
    try:
        mycursor.execute(sql, params or ())
        return mycursor.fetchall()
    except Error as e:
        print("Error is: ", e)
        return None
    finally:
        mycursor.close()


# Run an INSERT / UPDATE / DELETE. Returns True if it worked, False if not.
def execute_update_query(con, sql, params=None):
    mycursor = con.cursor()
    try:
        mycursor.execute(sql, params or ())
        con.commit()
        return True
    except Error as e:
        print("Error is : ", e)
        con.rollback()
        return False
    finally:
        mycursor.close()
