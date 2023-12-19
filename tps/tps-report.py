import matplotlib.pyplot as plt
import csv
import sys


def main(filename: str):
    if not filename.endswith(".csv"):
        print("Support only .csv file.")
        exit(1)

    x = []
    y = []

    with open(filename, 'r') as csvfile:
        lines = csv.reader(csvfile, delimiter=',')
        next(lines, None)  # skip the headers
        for row in lines:
            if row[0] is str:
                continue
            x.append(int(row[0].strip()))
            y.append(int(row[6].strip()))

    ax = plt.gca()
    ax.ticklabel_format(useOffset=False)

    plt.plot(x[1:], y[1:], color='g', linestyle='solid', label=filename)

    plt.xlabel('Transaction Sent')
    plt.ylabel('Calculated TPS')
    plt.xscale('log')
    plt.title(
        'TPS Report (4v CPU, 16 GB, 2 Validators, Block Time = 3s)', fontsize=12)
    plt.legend()
    plt.grid()
    plt.savefig(filename.replace(".csv", ".png"))
    plt.show()


if __name__ == "__main__":
    print("The usage: python tps-report.py <file_generated_from_tps.js>.csv")
    filename = sys.argv[1]
    main(filename)
