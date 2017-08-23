# ____________________________________________________
# I M P O R T S

import sys
from PyQt5.QtWidgets import QMainWindow, QApplication, \
    QWidget, QAction, QTableWidget,QTableWidgetItem,QVBoxLayout
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import pyqtSlot

import random
# ____________________________________________________
# C O N S T A N T S


# ____________________________________________________
# C L A S S E S

class App(QWidget):
    def __init__(self):
        super().__init__()
        self.title = 'Crossword Maker'
        self.left = 0
        self.top = 0
        self.width = 800
        self.height = 600
        self.initUI()

    def initUI(self):
        self.setWindowTitle(self.title)
        self.setGeometry(self.left, self.top, self.width, self.height)

        self.createTable()

        # Add box layout, add table to box layout and add box layout to widget
        self.layout = QVBoxLayout()
        self.layout.addWidget(self.tableWidget)
        self.setLayout(self.layout)

        # Show widget
        self.show()

    def createTable(self):
        # Create table
        rows = 15
        cols = 15
        cell_size = 36 # or self.height / rows
        self.tableWidget = QTableWidget()
        self.tableWidget.setRowCount(rows)
        self.tableWidget.setColumnCount(cols)
        self.tableWidget.verticalHeader().hide()
        self.tableWidget.horizontalHeader().hide()

        for row in range(0, rows):
            self.tableWidget.setRowHeight(row, cell_size)

        for col in range(0, cols):
            self.tableWidget.setColumnWidth(col, cell_size)

        for row in range(0, rows):
            for col in range(0, cols):
                self.tableWidget.setItem(row, col, QTableWidgetItem(random.choice("ABCDEFGHIJKLMNOP---.....")))
                # self.tableWidget.setItem(row, col, QTableWidgetItem.setTextAlignment(0))
        self.tableWidget.move(0, 0)

        # table selection change
        self.tableWidget.doubleClicked.connect(self.on_click)

    @pyqtSlot()
    def on_click(self):
        for currentQTableWidgetItem in self.tableWidget.selectedItems():
            print(currentQTableWidgetItem.row(), currentQTableWidgetItem.column(), currentQTableWidgetItem.text())


# ____________________________________________________
# M A I N

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = App()
    sys.exit(app.exec_())

# ____________________________________________________
# N O T E S

