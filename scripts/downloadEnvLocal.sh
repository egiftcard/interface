itemname=$1
file=$2
rm $file
{
  op document get $itemname --output=$file
} || {
  echo "Make sure you have the 1Pass CLI installed and that you are logged in. More info: https://developer.1password.com/docs/cli/get-started#install"
}