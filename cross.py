# Crossbow 0.0 (June 2017)
# Keiran King (keiranking.com)

# ____________________________________________________
# I M P O R T S

import datetime
import re
import requests
from bs4 import BeautifulSoup
from operator import attrgetter

# ____________________________________________________
# C O N S T A N T S

MIN_CW_SIZE = 3
MAX_CW_SIZE = 21
MIN_DICT_WORD_LENGTH = 3
MAX_DICT_WORD_LENGTH = 15
BLANK = "-"
BLACK = "."
ACROSS = "across"
DOWN = "down"

# ____________________________________________________
# C L A S S E S


class Wordlist(object):
    def __init__(self, file):
        self.words = [[], [], [], [],
                     [], [], [], [],
                     [], [], [], [],
                     [], [], [], []]

        try:
            with open(file, "r") as raw:
                raw_list = raw.read().split("\n")
        except FileNotFoundError:
            print("Could not open '" + file + "'.")
            return

        for new_word in raw_list:
            new_word = new_word.strip().upper()
            if MAX_DICT_WORD_LENGTH >= len(new_word) >= MIN_DICT_WORD_LENGTH:
                self.words[len(new_word)].append(new_word)

        for i in range(MIN_DICT_WORD_LENGTH, MAX_DICT_WORD_LENGTH + 1):
            self.words[i].sort()

    def save_to(self, file):
        try:
            with open(file, "w") as save_file:
                for i in range(MIN_DICT_WORD_LENGTH, MAX_DICT_WORD_LENGTH + 1):
                    if len(self.words[i]) > 0:
                        previous_word = ""
                        save_file.write("\n" + str(i) + "\n")
                        for word in self.words[i]:
                            if word != previous_word:
                                save_file.write(word + "\n")
                                previous_word = word
                print("Wordlist saved to '" + file + "'.")

        except FileNotFoundError:
            print("Could not write to '" + save_file + "'.")

    def add(self, word):
        new_word = word.strip().upper()
        if MAX_DICT_WORD_LENGTH >= len(new_word) >= MIN_DICT_WORD_LENGTH:
            self.words[len(new_word)].append(new_word)
            self.words[len(new_word)].sort()

    def delete(self, word):
        unwanted_word = word.strip().upper()
        if MAX_DICT_WORD_LENGTH >= len(unwanted_word) >= MIN_DICT_WORD_LENGTH:
            i = 0
            for word in self.words[len(unwanted_word)]:
                if word == unwanted_word:
                    self.words[len(unwanted_word)].pop(i)
                i += 1

    def printify(self):
        for i in range(MIN_DICT_WORD_LENGTH, MAX_DICT_WORD_LENGTH + 1):
            if len(self.words[i]) > 0:
                print("\n" + str(i))
                for word in self.words[i]:
                    print(word)
        print("\n")

    def matches(self, query):
        match_list = []
        for word in self.words[len(query)]:
            pattern = re.compile(query.replace(BLANK, "."))
            if pattern.fullmatch(word):
                match_list.append(word)

        return match_list

    def rank(self, list):
        for word in list:
            r = requests.get("http://crosswordtracker.com/answer/" + word.lower() + "/")
            lookup_data = BeautifulSoup(r.content, "html.parser")
            # Search for the right data snippet, search within snippet for a number, grab the first one
            frequency = re.search(r'\d+', str(lookup_data.find_all(string=re.compile("we have spotted"))))[0]
            print(word + " " + frequency)


class Entry(object):
    def __init__(self, row, col, label, direction, clue, ans):
        self.row = row
        self.col = col
        self.label = label
        self.direction = direction
        self.clue = clue
        self.answer = ans

    def printify(self):
        print(str(self.label) + self.direction[0] + ". " + self.clue
              + ": " + self.answer + " [" + str(self.row) + "," + str(self.col) + "]")


class Crossword(object):
    def __init__(self, source="default"):
        self.date = None
        self.rows = 0
        self.cols = 0

        self.grid = []
        self.entries = []
        # self.circles = []
        # self.shades = []
        # self.rebus = []
        self.info = {"type": "normal",
                     "title": "Untitled",
                     "author": "Anonymous",
                     "editor": "",
                     "copyright": "",
                     "publisher": "",
                     "notepad": ""}

        # Load file, if possible.
        try:
            file = str(source)
            self.read_xpf(file)
            return
        except FileNotFoundError as error:
            print("Could not open '" + file + "'.")
            print(error)

        # Create new crossword of specified size, if possible.
        try:
            size = int(source)
            if MIN_CW_SIZE <= size <= MAX_CW_SIZE:
                print("Creating new " + str(size) + " x " + str(size) + " crossword...")
                self.make_new_crossword(size)
                return
            else:
                raise ValueError("Invalid size. Must be "
                                 + str(MIN_CW_SIZE) + " - " + str(MAX_CW_SIZE) + ".")
        except ValueError as error:
            print(error)

        # Otherwise, default to a new daily US crossword.
        print("Creating default crossword...")
        self.make_new_crossword()

    def read_xpf(self, file):
        with open(file) as raw_data:
            print("Opening " + file + "...\n")
            puz = BeautifulSoup(raw_data, "lxml").puzzle
            if puz is None:
                raise FileNotFoundError("Could not open '" + file + "'.")

            # Get puzzle info: title, author, etc.
            for key in self.info:
                try:
                    self.info[key] = puz.find(key).string
                except AttributeError:
                    self.info[key] = ""

            # Get puzzle date.
            try:
                self.date = datetime.datetime.strptime(str(puz.date.string), "%m/%d/%Y")
            except AttributeError:
                self.date = ""

            self.rows = int(puz.rows.string)
            self.cols = int(puz.cols.string)

            # Get puzzle grid.
            for row in puz.find_all("row"):
                self.grid.append(str(row.string))

            # Get and sort puzzle clues.
            for entry in puz.find_all("clue"):
                self.entries.append(Entry(int(entry["row"]) - 1, int(entry["col"]) - 1,
                                        int(entry["num"]), entry["dir"].lower(),
                                        entry.string, entry["ans"]))
            self.entries.sort(key=attrgetter('row', 'col'))

    def write_xpf(self, file):
        pass

    def make_new_crossword(self, size=15):
        self.date = datetime.date.today()
        self.rows = size
        self.cols = size

        # Create grid and clues.
        for i in range(0, size):
            self.grid.append(BLANK * size)
            self.entries.append(Entry(i, 0, 0, ACROSS, "", BLANK * size))
            self.entries.append(Entry(0, i, 0, DOWN, "", BLANK * size))
            self.entries.sort(key=attrgetter('row', 'col'))
            self.number_entries()

    def number_entries(self):
        # Number the first entry and initialize variables
        count = 1
        self.entries[0].label = count
        prev_row = self.entries[0].row
        prev_col = self.entries[0].col

        # Number all other entries.
        for entry in self.entries[1:]:
            if entry.row > prev_row or entry.col > prev_col:
                count += 1
            entry.label = count
            prev_row = entry.row
            prev_col = entry.col

    # Print the crossword to the terminal.
    def printify(self):
        print("\n" + self.info["title"] + " by " + self.info["author"])
        print("------------------------------------------------------")
        # print("Editor: " + self.info["editor"])
        # print("Copyright: " + self.info["copyright"])
        # print("Publisher: " + self.info["publisher"])
        print(self.date.strftime("%d %b %Y") + " | " + str(self.rows) + "x" + str(self.cols) + "\n")

        for row in self.grid:
            print(row)

        print("\n" + "Across: ")
        for entry in self.entries:
            if entry.direction == ACROSS:
                entry.printify()
        print("\n" + "Down: ")
        for entry in self.entries:
            if entry.direction == DOWN:
                entry.printify()

    # Edit a single square, and update all affected entries.
    def set_square(self, row, col, new_fill):
        try:
            if row < 0 or row > self.rows - 1 or col < 0 or col > self.cols - 1:
                raise ValueError("Row or column out of range.")

            old_fill = self.grid[row][col]

            if len(new_fill) != 1:
                raise ValueError("Fill must be single character.")

            cw.grid[row] = cw.grid[row][:col] + new_fill.upper() + cw.grid[row][col + 1:]

            # If this is a new black square...
            if old_fill is not BLACK and new_fill is BLACK:
                # Delete any obsolete entries.
                for entry in reversed(self.entries):
                    if entry.row == row and entry.col == col:
                        self.entries.remove(entry)

                # Make a new across entry to the right, if needed.
                if col + 1 < self.cols:
                    if self.grid[row][col + 1] is not BLACK:
                        self.entries.append(Entry(row, col + 1, 0, ACROSS, "", self.read_across_from(row, col + 1)))

                # Make a new down entry below, if needed.
                if row + 1 < self.rows:
                    if self.grid[row + 1][col] is not BLACK:
                        self.entries.append(Entry(row + 1, col, 0, DOWN, "", self.read_down_from(row + 1, col)))

                # Update entries above and to the left.
                if col != 0:
                    if cw.grid[row][col - 1] is not BLACK:
                        self.update_across_entry_spanning(row, col - 1)
                if row != 0:
                    if cw.grid[row - 1][col] is not BLACK:
                        self.update_down_entry_spanning(row - 1, col)

                self.entries.sort(key=attrgetter('row', 'col'))
                self.number_entries()

            # If this is a new white square...
            elif old_fill is BLACK and new_fill is not BLACK:
                # Delete any obsolete entries.
                for entry in reversed(self.entries):
                    if entry.row == row and entry.col == col + 1 and entry.direction == ACROSS:
                        self.entries.remove(entry)
                    if entry.col == col and entry.row == row + 1 and entry.direction == DOWN:
                        self.entries.remove(entry)

                # Make a new across entry, if needed.
                if col == 0:
                    self.entries.append(Entry(row, col, 0, ACROSS, "", self.read_across_from(row, col)))
                elif self.grid[row][col - 1] is BLACK:
                    self.entries.append(Entry(row, col, 0, ACROSS, "", self.read_across_from(row, col)))
                else:
                    self.update_across_entry_spanning(row, col)

                # Make a new down entry, if needed.
                if row == 0:
                    self.entries.append(Entry(row, col, 0, DOWN, "", self.read_down_from(row, col)))
                elif self.grid[row - 1][col] is BLACK:
                    self.entries.append(Entry(row, col, 0, DOWN, "", self.read_down_from(row, col)))
                else:
                    self.update_down_entry_spanning(row, col)

                self.entries.sort(key=attrgetter('row', 'col'))
                self.number_entries()

            else:
                self.update_across_entry_spanning(row, col)
                self.update_down_entry_spanning(row, col)

        except ValueError as error:
            print(error)

    def update_across_entry_spanning(self, row, col):
        for entry in reversed(self.entries):
            if entry.direction == ACROSS and entry.row == row and entry.col <= col:
                entry.answer = self.read_across_from(entry.row, entry.col)
                break

    def update_down_entry_spanning(self, row, col):
        for entry in reversed(self.entries):
            if entry.direction == DOWN and entry.col == col and entry.row <= row:
                entry.answer = self.read_down_from(entry.row, entry.col)
                break

    def read_across_from(self, row, col):
        try:
            if self.grid[row][col] is BLACK:
                return ""
            elif col + 1 == self.cols:
                return self.grid[row][col]
            else:
                return self.grid[row][col] + self.read_across_from(row, col + 1)
        except IndexError as error:
            print(error)
            return None

    def read_down_from(self, row, col):
        try:
            if self.grid[row][col] is BLACK:
                return ""
            elif row + 1 == self.rows:
                return self.grid[row][col]
            else:
                return self.grid[row][col] + self.read_down_from(row + 1, col)
        except IndexError as error:
            print(error)
            return None

    # Returns Across entry that spans given location. Controller may need this function.
    def get_across_entry_spanning(self, row, col):
        try:
            if self.grid[row][col] is BLACK:
                return None

            for entry in reversed(self.entries):
                if entry.direction == ACROSS and entry.row == row and entry.col <= col:
                    return entry
        except IndexError as error:
            print(error)

    # Returns Down entry that spans given location. Controller may need this function.
    def get_down_entry_spanning(self, row, col):
        if self.grid[row][col] is BLACK:
            return None

        for entry in reversed(self.entries):
            if entry.direction == DOWN and entry.col == col and entry.row <= row:
                return entry

        return None

    def set_across_clue_at(self, row, col, clue=""):
        if clue is None:
            clue = ""

        if self.grid[row][col] is not BLACK:
            for entry in reversed(self.entries):
                if entry.direction == ACROSS and entry.row == row and entry.col <= col:
                    entry.clue = str(clue)
                    break

    def set_down_clue_at(self, row, col, clue=""):
        if clue is None:
            clue = ""

        if self.grid[row][col] is not BLACK:
            for entry in reversed(self.entries):
                if entry.direction == DOWN and entry.col == col and entry.row <= row:
                    entry.clue = str(clue)
                    break

# ____________________________________________________
# M A I N

cw = Crossword("example.xml")
current_row = 0
current_col = 2

# cw.set_square(0, 5, BLACK)
# cw.set_square(0, 2, "i")
# cw.set_square(1, 4, BLACK)
# cw.set_square(2, 4, BLACK)
# cw.set_square(2, 3, "k")
# cw.set_square(3, 4, "r")
# cw.set_square(2, 4, BLANK)

cw.set_across_clue_at(current_row, current_col, "boogie")
cw.set_down_clue_at(current_row, current_col, "woogie")
cw.printify()

wordlist = Wordlist("wordlist.txt")

print(wordlist.matches(cw.get_across_entry_spanning(current_row, current_col).answer))
print(wordlist.matches(cw.get_down_entry_spanning(current_row, current_col).answer))

wordlist.add("interest")
wordlist.delete("mannerism")
wordlist.printify()

# wordlist.rank(["coffee", "swanee", "McAfee", "entree", "Yankee"])
wordlist.rank(wordlist.matches(cw.get_down_entry_spanning(current_row, current_col).answer))

# wordlist.save_to("wordlist.txt")

# month, day, year = list(map(int, str(puz.date.string).split("/")))
# self.date = datetime.date(year, month, day)

# ____________________________________________________
# N O T E S

# Entry() initializer doesn't need .label; it will be assigned programmatically.
# Entry() class doesn't need .answer at all
