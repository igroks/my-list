package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/igroks/sd-project/backend/app/config"
	"github.com/igroks/sd-project/backend/app/database"
	"github.com/igroks/sd-project/backend/app/models"
)

func Add(c *gin.Context) {
	var requestMsg models.Request
	databaseName := c.Param("databaseName")

	if err := c.ShouldBindJSON(&requestMsg); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	db := database.OpenConn(config.GetDatabaseConfig(databaseName))

	sqlQuery := `INSERT INTO items (name) VALUES ($1)`
	_, err := db.Exec(sqlQuery, *requestMsg.Item)

	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	defer db.Close()

	c.JSON(http.StatusOK, models.Response{
		Message: "New item added",
	})
}

func List(c *gin.Context) {
	var items []string
	databaseName := c.Param("databaseName")

	db := database.OpenConn(config.GetDatabaseConfig(databaseName))

	sqlQuery := `SELECT name FROM items`
	rows, err := db.Query(sqlQuery)

	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	for rows.Next() {
		var item string
		rows.Scan(&item)
		items = append(items, item)
	}

	defer rows.Close()
	defer db.Close()

	c.JSON(http.StatusOK, map[string][]string{
		"items": items,
	})
}

func Delete(c *gin.Context) {
	var requestMsg models.Request
	databaseName := c.Param("databaseName")

	if err := c.ShouldBindJSON(&requestMsg); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	db := database.OpenConn(config.GetDatabaseConfig(databaseName))

	sqlQuery := `DELETE FROM items WHERE name = $1`
	_, err := db.Exec(sqlQuery, *requestMsg.Item)

	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Message: "Item deleted successfully",
	})
}
